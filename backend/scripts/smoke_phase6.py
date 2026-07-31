"""Phase 6 冒烟测试：商品发布 / 浏览 / 详情 / XP / 上传状态。"""

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

    # 1. 上传服务状态（未配置 Cloudinary 时应为 False 且接口不报错）
    status = call("GET", "/uploads/status", token=token_a)
    assert status["success"], status
    print("upload status:", status["data"])

    # 2. Alice 发布商品（+10 XP）
    xp_before = get_xp(token_a)
    res = call(
        "POST",
        "/products",
        {
            "title": "线性代数教材（第 6 版）",
            "description": "九成新，无笔记，课程结束闲置。",
            "price": 25.5,
            "category": "Textbook",
        },
        token=token_a,
    )
    assert res["success"], res
    product = res["data"]
    assert product["is_seller"] and product["price"] == 25.5
    assert get_xp(token_a) == xp_before + 10, "发布商品应 +10 XP"
    print("create product: ok (+10 XP)")

    # 3. 免费商品与分类过滤
    call(
        "POST",
        "/products",
        {
            "title": "旧羽毛球拍免费送",
            "description": "用了一年，送给需要的同学。",
            "price": 0,
            "category": "Sports",
        },
        token=token_b,
    )
    listing = call("GET", "/products", token=token_b)
    assert len(listing["data"]) >= 2
    # 倒序：最新发布在前
    assert listing["data"][0]["title"] == "旧羽毛球拍免费送"
    sports = call("GET", "/products?category=Sports", token=token_b)
    assert all(p["category"] == "Sports" for p in sports["data"])
    print("list & filter & order: ok")

    # 4. 详情与视角
    detail = call("GET", f"/products/{product['id']}", token=token_b)
    assert detail["success"] and detail["data"]["is_seller"] is False
    assert detail["data"]["seller"]["name"] == "Alice"
    print("detail & seller info: ok")

    # 5. 参数校验与 404
    bad = call(
        "POST",
        "/products",
        {"title": "", "description": "x", "price": -1, "category": "Nope"},
        token=token_a,
    )
    assert bad["success"] is False, bad
    missing = call("GET", "/products/999999", token=token_a)
    assert missing["success"] is False, missing
    print("validation & 404: ok")

    print("\nPhase 6 smoke test: ALL PASSED")


if __name__ == "__main__":
    main()
