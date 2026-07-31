"""他人主页 + 商品管理冒烟测试。"""

import time

import httpx

BASE = "http://127.0.0.1:8000/api"
STAMP = int(time.time())
PASSED = 0


def check(name: str, condition: bool) -> None:
    global PASSED
    print(f"[{'PASS' if condition else 'FAIL'}] {name}")
    if condition:
        PASSED += 1
    else:
        raise SystemExit(1)


def register(client: httpx.Client, tag: str) -> tuple[str, dict]:
    resp = client.post(
        f"{BASE}/auth/register",
        json={
            "name": f"用户{tag}",
            "email": f"smoke9_{tag}_{STAMP}@test.com",
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

    # ---------- 他人主页 ----------
    r = c.get(f"{BASE}/users/{user_b['id']}", headers=auth(token_a))
    profile = r.json()["data"]
    check("浏览他人主页", r.status_code == 200 and profile["id"] == user_b["id"])
    check("主页不含邮箱", "email" not in profile)
    check("主页含活动/商品/帖子字段", all(k in profile for k in ("events", "products", "posts")))
    check("他人主页 is_self=false", profile["is_self"] is False)

    r = c.get(f"{BASE}/users/{user_a['id']}", headers=auth(token_a))
    check("自己主页 is_self=true", r.json()["data"]["is_self"] is True)

    # ---------- 商品管理 ----------
    r = c.post(
        f"{BASE}/products",
        headers=auth(token_a),
        json={
            "title": "冒烟教材",
            "description": "九成新",
            "price": 20,
            "category": "Textbook",
        },
    )
    product_id = r.json()["data"]["id"]
    check("发布商品 status=active", r.status_code == 201 and r.json()["data"]["status"] == "active")

    r = c.put(
        f"{BASE}/products/{product_id}",
        headers=auth(token_a),
        json={"title": "冒烟教材（改）", "price": 15},
    )
    check("卖家编辑商品", r.status_code == 200 and r.json()["data"]["title"] == "冒烟教材（改）")

    r = c.put(
        f"{BASE}/products/{product_id}",
        headers=auth(token_b),
        json={"title": "黑客"},
    )
    check("非卖家编辑被拒", r.status_code == 403)

    r = c.get(f"{BASE}/products", headers=auth(token_b))
    check("市场列表含在售商品", any(p["id"] == product_id for p in r.json()["data"]))

    r = c.post(f"{BASE}/products/{product_id}/sold", headers=auth(token_a))
    check("标记卖掉", r.status_code == 200 and r.json()["data"]["status"] == "sold")

    r = c.get(f"{BASE}/products", headers=auth(token_b))
    check("卖掉后不在默认列表", not any(p["id"] == product_id for p in r.json()["data"]))

    r = c.get(
        f"{BASE}/products",
        headers=auth(token_a),
        params={"seller_id": user_a["id"], "include_sold": True},
    )
    check("按卖家可查到已卖掉", any(p["id"] == product_id for p in r.json()["data"]))

    r = c.get(f"{BASE}/users/{user_a['id']}", headers=auth(token_b))
    check("他人主页含已卖掉商品", any(p["id"] == product_id for p in r.json()["data"]["products"]))

    r = c.delete(f"{BASE}/products/{product_id}", headers=auth(token_b))
    check("非卖家删除被拒", r.status_code == 403)

    r = c.delete(f"{BASE}/products/{product_id}", headers=auth(token_a))
    check("卖家删除商品", r.status_code == 200)

    r = c.get(f"{BASE}/products/{product_id}", headers=auth(token_a))
    check("删除后商品不存在", r.status_code == 404)

print(f"\n全部通过：{PASSED} 项")
