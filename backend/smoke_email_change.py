"""更改邮箱冒烟测试。"""

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


with httpx.Client(timeout=20) as c:
    r = c.post(
        f"{BASE}/auth/register",
        json={
            "name": "改邮用户",
            "email": f"email_old_{STAMP}@test.com",
            "password": "pass1234",
            "school": "测试大学",
            "grade": "大二",
            "interests": [],
        },
    )
    token = r.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    new_email = f"email_new_{STAMP}@test.com"

    r = c.post(
        f"{BASE}/users/me/email/request",
        headers=headers,
        json={"new_email": new_email, "password": "wrong"},
    )
    check("错误密码被拒", r.status_code == 401)

    r = c.post(
        f"{BASE}/users/me/email/request",
        headers=headers,
        json={"new_email": f"email_old_{STAMP}@test.com", "password": "pass1234"},
    )
    check("新旧邮箱相同被拒", r.status_code == 422)

    r = c.post(
        f"{BASE}/users/me/email/request",
        headers=headers,
        json={"new_email": new_email, "password": "pass1234"},
    )
    code = (r.json().get("data") or {}).get("dev_code")
    check("发送验证码成功", r.status_code == 200 and bool(code))

    r = c.post(
        f"{BASE}/users/me/email/request",
        headers=headers,
        json={"new_email": new_email, "password": "pass1234"},
    )
    check("60 秒内重复发送被限流", r.status_code == 429)

    r = c.post(
        f"{BASE}/users/me/email/confirm",
        headers=headers,
        json={"code": "000000"},
    )
    check("错误验证码被拒", r.status_code == 400)

    r = c.post(
        f"{BASE}/users/me/email/confirm",
        headers=headers,
        json={"code": code},
    )
    check("验证码确认成功", r.status_code == 200 and r.json()["data"]["email"] == new_email)

    r = c.get(f"{BASE}/users/me", headers=headers)
    check("资料中邮箱已更新", r.json()["data"]["email"] == new_email)

    r = c.post(
        f"{BASE}/auth/login",
        json={"email": new_email, "password": "pass1234"},
    )
    check("新邮箱可登录", r.status_code == 200)

    r = c.post(
        f"{BASE}/auth/login",
        json={"email": f"email_old_{STAMP}@test.com", "password": "pass1234"},
    )
    check("旧邮箱不可登录", r.status_code == 401)

print(f"\n全部通过：{PASSED} 项")
