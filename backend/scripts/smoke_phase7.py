"""Phase 7 冒烟测试：发帖 / 信息流 / 点赞切换 / 评论 / XP。"""

import json
import urllib.error
import urllib.request

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


def login(email: str) -> str:
    res = call("POST", "/auth/login", {"email": email, "password": "secret123"})
    assert res["success"], res
    return res["data"]["access_token"]


def get_xp(token: str) -> int:
    return call("GET", "/users/me", token=token)["data"]["xp"]


def main() -> None:
    token_a = login("alice@test.edu")
    token_b = login("bob@test.edu")

    # 1. 发帖
    res = call(
        "POST",
        "/posts",
        {"content": "有人一起组队参加下个月的数学建模比赛吗？"},
        token=token_a,
    )
    assert res["success"], res
    post = res["data"]
    post_id = post["id"]
    assert post["is_author"] and post["like_count"] == 0 and post["comment_count"] == 0
    print("create post: ok")

    # 2. 信息流倒序
    feed = call("GET", "/posts", token=token_b)
    assert feed["success"] and feed["data"][0]["id"] == post_id
    assert feed["data"][0]["is_author"] is False
    print("feed order & perspective: ok")

    # 3. 点赞切换
    like1 = call("POST", f"/posts/{post_id}/like", token=token_b)
    assert like1["data"]["liked"] is True and like1["data"]["like_count"] == 1
    like2 = call("POST", f"/posts/{post_id}/like", token=token_b)
    assert like2["data"]["liked"] is False and like2["data"]["like_count"] == 0
    like3 = call("POST", f"/posts/{post_id}/like", token=token_b)
    assert like3["data"]["liked"] is True and like3["data"]["like_count"] == 1
    print("like toggle: ok")

    # 4. 评论（+5 XP）
    xp_before = get_xp(token_b)
    comment = call(
        "POST",
        f"/posts/{post_id}/comments",
        {"content": "我有兴趣！私聊一下？"},
        token=token_b,
    )
    assert comment["success"], comment
    assert get_xp(token_b) == xp_before + 5, "评论应 +5 XP"
    comments = call("GET", f"/posts/{post_id}/comments", token=token_a)
    assert len(comments["data"]) == 1
    assert comments["data"][0]["author"]["name"] == "Bob"
    feed2 = call("GET", "/posts", token=token_a)
    target = next(p for p in feed2["data"] if p["id"] == post_id)
    assert target["comment_count"] == 1 and target["like_count"] == 1
    print("comment & counts: ok (+5 XP)")

    # 5. 校验与 404
    empty = call("POST", "/posts", {"content": ""}, token=token_a)
    assert empty["success"] is False
    missing = call("POST", "/posts/999999/like", token=token_a)
    assert missing["success"] is False
    print("validation & 404: ok")

    print("\nPhase 7 smoke test: ALL PASSED")


if __name__ == "__main__":
    main()
