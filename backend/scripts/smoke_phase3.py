"""Phase 3 冒烟测试：注册测试用户并验证推荐接口。"""

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


def ensure_user(email: str, name: str, interests: list[str]) -> str:
    """注册用户；已存在则登录，返回 token。"""
    payload = {
        "name": name,
        "email": email,
        "password": "secret123",
        "school": "测试大学",
        "grade": "大二",
        "interests": interests,
    }
    res = call("POST", "/auth/register", payload)
    if not res["success"]:
        res = call("POST", "/auth/login", {"email": email, "password": "secret123"})
    assert res["success"], res
    return res["data"]["access_token"]


def main() -> None:
    health = call("GET", "/health")
    print("health:", health["data"])
    assert health["data"]["database"] == "connected", "数据库未连接"

    token_a = ensure_user("alice@test.edu", "Alice", ["AI", "Python", "摄影"])
    ensure_user("bob@test.edu", "Bob", ["Python", "篮球", "AI"])
    ensure_user("carol@test.edu", "Carol", ["音乐", "舞蹈"])

    me = call("GET", "/users/me", token=token_a)
    assert me["success"] and me["data"]["email"] == "alice@test.edu"
    print("me:", me["data"]["name"], me["data"]["interests"])

    rec = call("GET", "/users/recommended", token=token_a)
    assert rec["success"], rec
    for p in rec["data"]:
        print("recommended:", p["name"], "common:", p["common_interests"])

    names = [p["name"] for p in rec["data"]]
    assert names.index("Bob") < names.index("Carol"), "排序错误：Bob 应排在 Carol 前"

    unauth = call("GET", "/users/recommended")
    assert unauth["success"] is False, "未登录应返回 401"
    print("unauthorized check: ok")

    print("\nPhase 3 smoke test: ALL PASSED")


if __name__ == "__main__":
    main()
