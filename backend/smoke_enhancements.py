"""增强功能冒烟测试：忘记密码 / 活动管理 / 私信。"""

import time

import httpx

BASE = "http://127.0.0.1:8000/api"
STAMP = int(time.time())
PASSED = 0


def check(name: str, condition: bool, extra: str = "") -> None:
    global PASSED
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {name}" + (f"  <- {extra}" if extra and not condition else ""))
    if condition:
        PASSED += 1
    else:
        raise SystemExit(1)


def register(client: httpx.Client, tag: str) -> tuple[str, dict]:
    resp = client.post(
        f"{BASE}/auth/register",
        json={
            "name": f"用户{tag}",
            "email": f"smoke8_{tag}_{STAMP}@test.com",
            "password": "pass1234",
            "school": "测试大学",
            "grade": "大二",
            "interests": ["AI"],
        },
    )
    data = resp.json()["data"]
    return data["access_token"], data["user"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


with httpx.Client(timeout=20) as c:
    token_a, user_a = register(c, "a")
    token_b, user_b = register(c, "b")
    token_c, user_c = register(c, "c")

    # ---------- 忘记密码 ----------
    r = c.post(f"{BASE}/auth/forgot-password", json={"email": user_a["email"]})
    reset_token = (r.json().get("data") or {}).get("reset_token")
    check("忘记密码返回重置 Token（开发模式）", r.status_code == 200 and bool(reset_token))

    r = c.post(f"{BASE}/auth/forgot-password", json={"email": f"none_{STAMP}@x.com"})
    check("不存在的邮箱也返回 200（防枚举）", r.status_code == 200 and r.json()["data"] is None)

    # 重置 Token 不能当登录 Token 用
    r = c.get(f"{BASE}/users/me", headers=auth(reset_token))
    check("重置 Token 不能当登录凭证", r.status_code == 401)

    r = c.post(
        f"{BASE}/auth/reset-password",
        json={"token": reset_token, "new_password": "newpass99"},
    )
    check("重置密码成功", r.status_code == 200)

    r = c.post(
        f"{BASE}/auth/login",
        json={"email": user_a["email"], "password": "newpass99"},
    )
    check("新密码可登录", r.status_code == 200)
    token_a = r.json()["data"]["access_token"]

    r = c.post(
        f"{BASE}/auth/reset-password",
        json={"token": reset_token, "new_password": "hack123"},
    )
    check("旧重置 Token 已失效（一次性）", r.status_code == 400)

    # ---------- 活动管理 ----------
    r = c.post(
        f"{BASE}/events",
        headers=auth(token_a),
        json={
            "title": "冒烟活动",
            "description": "测试",
            "category": "Academic",
            "location": "图书馆",
            "date": "2030-01-01",
            "time": "10:00",
            "max_participants": 5,
        },
    )
    event_id = r.json()["data"]["id"]
    check("创建活动", r.status_code == 201 and r.json()["data"]["status"] == "active")

    r = c.put(
        f"{BASE}/events/{event_id}",
        headers=auth(token_a),
        json={"title": "冒烟活动（改）", "max_participants": 3},
    )
    check("发起人编辑活动", r.status_code == 200 and r.json()["data"]["title"] == "冒烟活动（改）")

    r = c.put(f"{BASE}/events/{event_id}", headers=auth(token_b), json={"title": "x"})
    check("非发起人编辑被拒", r.status_code == 403)

    r = c.post(f"{BASE}/events/{event_id}/join", headers=auth(token_b))
    check("B 加入活动", r.status_code == 200)

    r = c.get(f"{BASE}/events", headers=auth(token_a), params={"mine": "created"})
    check("mine=created 只含自己创建的", any(e["id"] == event_id for e in r.json()["data"]))

    r = c.get(f"{BASE}/events", headers=auth(token_b), params={"mine": "joined"})
    check("mine=joined 含加入的活动", any(e["id"] == event_id for e in r.json()["data"]))

    r = c.post(f"{BASE}/events/{event_id}/end", headers=auth(token_a))
    check("发起人结束活动", r.status_code == 200 and r.json()["data"]["status"] == "ended")

    r = c.post(f"{BASE}/events/{event_id}/join", headers=auth(token_c))
    check("已结束活动无法加入", r.status_code == 409)

    r = c.delete(f"{BASE}/events/{event_id}", headers=auth(token_b))
    check("非发起人删除被拒", r.status_code == 403)

    r = c.delete(f"{BASE}/events/{event_id}", headers=auth(token_a))
    check("发起人删除活动", r.status_code == 200)

    r = c.get(f"{BASE}/events/{event_id}", headers=auth(token_a))
    check("删除后活动不存在", r.status_code == 404)

    # ---------- 私信 ----------
    r = c.post(
        f"{BASE}/messages/{user_b['id']}",
        headers=auth(token_a),
        json={"content": "你好，一起学习吗？"},
    )
    check("A 发私信给 B", r.status_code == 201)

    r = c.get(f"{BASE}/messages/unread-count", headers=auth(token_b))
    check("B 未读数为 1", r.json()["data"]["count"] == 1)

    r = c.get(f"{BASE}/messages/conversations", headers=auth(token_b))
    convs = r.json()["data"]
    check(
        "B 会话列表含 A 且未读 1",
        len(convs) == 1
        and convs[0]["peer"]["id"] == user_a["id"]
        and convs[0]["unread_count"] == 1,
    )

    r = c.get(f"{BASE}/messages/{user_a['id']}", headers=auth(token_b))
    check("B 拉取聊天记录", r.status_code == 200 and len(r.json()["data"]) == 1)

    r = c.get(f"{BASE}/messages/unread-count", headers=auth(token_b))
    check("拉取后未读清零", r.json()["data"]["count"] == 0)

    r = c.post(
        f"{BASE}/messages/{user_a['id']}",
        headers=auth(token_b),
        json={"content": "好呀！"},
    )
    check("B 回复 A", r.status_code == 201)

    r = c.post(
        f"{BASE}/messages/{user_a['id']}", headers=auth(token_a), json={"content": "x"}
    )
    check("不能给自己发私信", r.status_code == 422)

    # ---------- 用户公开资料 ----------
    r = c.get(f"{BASE}/users/{user_b['id']}", headers=auth(token_a))
    check(
        "查看他人公开资料（不含邮箱）",
        r.status_code == 200 and "email" not in r.json()["data"],
    )

print(f"\n全部通过：{PASSED} 项")
