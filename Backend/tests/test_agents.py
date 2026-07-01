"""Tests para endpoints de agentes."""


def test_agents_list(client):
    response = client.get("/api/v1/agents/")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "data" in body


def test_agent_detail_not_found(client):
    response = client.get("/api/v1/agents/agente_inexistente")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert body["data"] is None


def test_agent_runs(client):
    response = client.get("/api/v1/agents/agente_sag/runs")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "data" in body


def test_agent_runs_custom_limit(client):
    response = client.get("/api/v1/agents/agente_sag/runs?limit=5")
    assert response.status_code == 200


def test_agent_run_no_body(client):
    response = client.post("/api/v1/agents/agente_sag/run")
    assert response.status_code in (401, 403, 404, 429)


def test_agent_schedule_invalid_cron(client):
    response = client.patch("/api/v1/agents/agente_sag/schedule", json={"schedule": "invalido"})
    assert response.status_code in (400, 401, 403, 404)


def test_agent_toggle_endpoint_exists(client):
    response = client.patch("/api/v1/agents/agente_sag/enabled")
    assert response.status_code != 405


def test_scheduler_job_name_helper():
    from app.api.agents import _get_scheduler_job_name
    result = _get_scheduler_job_name("my-project", "agente_sag")
    assert "agente-sag" in result
    assert "my-project" in result
    assert "us-central1" in result


def test_scheduler_job_name_underscores():
    from app.api.agents import _get_scheduler_job_name
    result = _get_scheduler_job_name("proj", "agente_competidores")
    assert "agente-competidores" in result
