"""Phase 5 冒烟测试：匹配算法权重、排序与共同标签。"""

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


def set_profile(token: str, interests: list[str], goals: list[str], skills: list[str]) -> None:
    res = call(
        "PUT",
        "/users/me",
        {"interests": interests, "goals": goals, "skills": skills},
        token=token,
    )
    assert res["success"], res


def main() -> None:
    token_a = login("alice@test.edu")
    token_b = login("bob@test.edu")
    token_c = login("carol@test.edu")

    # Alice：基准用户
    set_profile(
        token_a,
        interests=["AI", "Python", "摄影"],
        goals=["数学建模", "做独立项目"],
        skills=["Python", "SQL"],
    )
    # Bob：三个维度全部重合 -> 100 分
    set_profile(
        token_b,
        interests=["ai", "python", "摄影"],  # 故意用小写验证大小写不敏感
        goals=["数学建模", "做独立项目"],
        skills=["Python", "SQL"],
    )
    # Carol：只有兴趣部分重合（1/2），目标技能无重合 -> 50% * 0.5 = 25 分
    set_profile(
        token_c,
        interests=["摄影", "音乐"],
        goals=["出国交换"],
        skills=["视频剪辑"],
    )

    res = call("GET", "/matches", token=token_a)
    assert res["success"], res
    matches = {m["user"]["name"]: m for m in res["data"]}

    bob, carol = matches["Bob"], matches["Carol"]
    print(f"Bob score={bob['score']}, common_skills={bob['common_skills']}")
    print(f"Carol score={carol['score']}, common_interests={carol['common_interests']}")

    assert bob["score"] == 100, f"Bob 应为满分，实际 {bob['score']}"
    assert carol["score"] == 25, f"Carol 应为 25 分，实际 {carol['score']}"
    assert set(t.lower() for t in bob["common_interests"]) == {"ai", "python", "摄影"}
    assert carol["common_interests"] == ["摄影"]
    assert carol["common_skills"] == [] and carol["common_goals"] == []

    order = [m["user"]["name"] for m in res["data"]]
    assert order.index("Bob") < order.index("Carol"), "排序应按分数降序"

    # 排序稳定性：Carol 视角，与 Alice 只共"摄影"兴趣
    res_c = call("GET", "/matches", token=token_c)
    assert res_c["success"]
    print("carol view top:", res_c["data"][0]["user"]["name"], res_c["data"][0]["score"])

    unauth = call("GET", "/matches")
    assert unauth["success"] is False, "未登录应 401"

    print("\nPhase 5 smoke test: ALL PASSED")


if __name__ == "__main__":
    main()
