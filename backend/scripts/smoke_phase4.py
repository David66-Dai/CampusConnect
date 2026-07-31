"""Phase 4 冒烟测试：活动创建 / 浏览 / 加入 / 退出 / XP。"""

import json
import urllib.error
import urllib.request
from datetime import date, timedelta

BASE = "http://localhost:8000/api"


def call(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body else None,
        method=method,
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {}),
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        return json.load(e)


def login(email: str) -> tuple[str, dict]:
    res = call("POST", "/auth/login", {"email": email, "password": "secret123"})
    assert res["success"], res
    return res["data"]["access_token"], res["data"]["user"]


def get_xp(token: str) -> int:
    me = call("GET", "/users/me", token=token)
    return me["data"]["xp"]


def main() -> None:
    token_a, _ = login("alice@test.edu")
    token_b, _ = login("bob@test.edu")
    token_c, _ = login("carol@test.edu")

    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    # 1. Alice 创建活动（+20 XP，自动成为成员）
    xp_before = get_xp(token_a)
    res = call(
        "POST",
        "/events",
        {
            "title": "Python 学习小组",
            "description": "每周一次的 Python 刷题与项目交流。",
            "category": "Academic",
            "location": "图书馆 3 楼研讨室",
            "date": tomorrow,
            "time": "19:00",
            "max_participants": 20,
        },
        token=token_a,
    )
    assert res["success"], res
    event = res["data"]
    event_id = event["id"]
    assert event["member_count"] == 1 and event["is_creator"] and event["is_joined"]
    assert get_xp(token_a) == xp_before + 20, "创建活动应 +20 XP"
    print("create event: ok (+20 XP)")

    # 2. 列表与分类过滤
    listing = call("GET", "/events", token=token_b)
    assert any(e["id"] == event_id for e in listing["data"])
    filtered = call("GET", "/events?category=Sports", token=token_b)
    assert all(e["category"] == "Sports" for e in filtered["data"])
    print("list & filter: ok")

    # 3. Bob 加入（+10 XP），重复加入 409
    xp_bob = get_xp(token_b)
    res = call("POST", f"/events/{event_id}/join", token=token_b)
    assert res["success"] and res["data"]["member_count"] == 2, res
    assert get_xp(token_b) == xp_bob + 10, "加入活动应 +10 XP"
    dup = call("POST", f"/events/{event_id}/join", token=token_b)
    assert dup["success"] is False and "已加入" in dup["message"], dup
    print("join & duplicate check: ok (+10 XP)")

    # 4. 满员校验：max=2 的活动，Carol 加入失败
    res = call(
        "POST",
        "/events",
        {
            "title": "羽毛球双打",
            "description": "两人满员测试。",
            "category": "Sports",
            "location": "体育馆",
            "date": tomorrow,
            "time": "18:00",
            "max_participants": 2,
        },
        token=token_a,
    )
    small_id = res["data"]["id"]
    assert call("POST", f"/events/{small_id}/join", token=token_b)["success"]
    full = call("POST", f"/events/{small_id}/join", token=token_c)
    assert full["success"] is False and "已满" in full["message"], full
    print("capacity check: ok")

    # 5. Bob 退出（-10 XP），创建者退出 403
    xp_bob = get_xp(token_b)
    res = call("DELETE", f"/events/{event_id}/leave", token=token_b)
    assert res["success"] and res["data"]["member_count"] == 1, res
    assert get_xp(token_b) == xp_bob - 10, "退出活动应 -10 XP"
    owner_leave = call("DELETE", f"/events/{event_id}/leave", token=token_a)
    assert owner_leave["success"] is False, owner_leave
    print("leave & creator-guard: ok")

    # 6. 详情与 404
    detail = call("GET", f"/events/{event_id}", token=token_c)
    assert detail["success"] and len(detail["data"]["members"]) == 1
    missing = call("GET", "/events/999999", token=token_c)
    assert missing["success"] is False, missing
    print("detail & 404: ok")

    print("\nPhase 4 smoke test: ALL PASSED")


if __name__ == "__main__":
    main()
