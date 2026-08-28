package com.kingkrass.z1.core

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
    val identityVersion: String = "1.0"
)

class CouncilRegistry {
    val agents: List<CouncilAgent> = (1..33).map { n ->
        val id = n.toString().padStart(2, '0')
        CouncilAgent(
            agentId = "council-$id",
            identity = "council-agent-$id",
            role = "Council of 33 specialist",
            capabilities = listOf("reasoning", "planning", "specialization"),
            memoryScope = "z1://memory/council/$id",
            permissions = listOf("read:authorized", "write:authorized"),
            toolPolicy = "mcp-policy-v1",
            governancePolicy = "z1-governance-v1",
            auditScope = "z1://audit/agent/council-$id"
        )
    }
}
