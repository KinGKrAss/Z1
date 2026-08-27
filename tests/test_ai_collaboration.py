from core.ai_collaboration import AICollaborationBus, CollaborationMessage, KnowledgeAssertion


def test_providers_can_exchange_and_compare_assertions() -> None:
    bus = AICollaborationBus()
    bus.register_provider("luna")
    bus.register_provider("gemini")

    bus.publish(CollaborationMessage(
        sender="luna",
        recipient="gemini",
        kind="request",
        subject="ppt_supply",
        payload={"question": "What is the current supply?"},
        authorization="review",
    ))
    bus.assert_knowledge(KnowledgeAssertion(
        subject="ppt_supply",
        value=100,
        source="z1-register",
        provider="luna",
        confidence=0.9,
    ))
    bus.assert_knowledge(KnowledgeAssertion(
        subject="ppt_supply",
        value=100,
        source="z1-register",
        provider="gemini",
        confidence=0.95,
    ))

    result = bus.compare("ppt_supply")
    assert result["agreement"] is True
    assert result["assertion_count"] == 2


def test_bus_does_not_allow_provider_write_authorization() -> None:
    bus = AICollaborationBus()
    bus.register_provider("luna")
    try:
        bus.publish(CollaborationMessage(
            sender="luna",
            recipient="z1",
            kind="mutation",
            subject="asset",
            authorization="write",
        ))
    except PermissionError:
        pass
    else:
        raise AssertionError("write authorization must be rejected")
