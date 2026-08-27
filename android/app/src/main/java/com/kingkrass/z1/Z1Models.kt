package com.kingkrass.z1

data class ContinuityState(
    val identityVersion: String,
    val stateVersion: Long,
    val legacyRef: String,
    val authorized: Boolean
)

data class CouncilAgent(
    val agentId: String,
    val identity: String,
    val role: String,
    val capabilities: List<String>,
    val memoryScope: String,
    val permissions: List<String>,
    val toolPolicy: String,
    val governancePolicy: String,
    val auditScope: String,
    val identityVersion: String
)

object CouncilRegistry {
    fun default(): List<CouncilAgent> = (1..33).map { index ->
        CouncilAgent(
            agentId = "council-${index.toString().padStart(2, '0')}",
            identity = "Council Agent ${index.toString().padStart(2, '0')}",
            role = "Persistent specialist",
            capabilities = listOf("reasoning", "planning"),
            memoryScope = "z1:council:${index.toString().padStart(2, '0')}",
            permissions = emptyList(),
            toolPolicy = "z1-policy",
            governancePolicy = "z1-governance",
            auditScope = "z1:audit",
            identityVersion = "1.0"
        )
    }
}
