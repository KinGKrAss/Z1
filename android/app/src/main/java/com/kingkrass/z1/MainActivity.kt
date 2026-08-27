package com.kingkrass.z1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = ContinuityStore(this)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Z1Screen(store)
                }
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun Z1Screen(store: ContinuityStore) {
    var state by remember { mutableStateOf(store.load()) }
    val agents = remember { CouncilRegistry.default() }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("🦁 Z1 PLATFORM", style = MaterialTheme.typography.headlineMedium)
            Text("Z1 bewahrt. Zoë interpretiert. Die 33 spezialisieren. MCP vermittelt. Das Modell rechnet.")
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Z1 Continuity")
                    Text("Identity: ${state.identityVersion}")
                    Text("State: ${state.stateVersion}")
                    Text("Legacy: ${state.legacyRef}")
                    Text("Authorization: ${if (state.authorized) "aktiv" else "nicht autorisiert"}")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            state = state.copy(stateVersion = state.stateVersion + 1)
                            store.save(state)
                        }) { Text("State speichern") }
                        Button(onClick = { state = store.load() }) { Text("Sync") }
                    }
                }
            }
        }
        item {
            Text("👑 Council of 33", style = MaterialTheme.typography.titleLarge)
        }
        items(agents) { agent ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(14.dp)) {
                    Text(agent.identity)
                    Text("agent_id: ${agent.agentId}")
                    Text("role: ${agent.role}")
                    Text("identity_version: ${agent.identityVersion}")
                    Text("model_id: external / replaceable")
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("MCP")
                    Text("Tools · Resources · Tasks · Interaction")
                    Text("Model Runtime: austauschbare Rechenressource")
                }
            }
        }
    }
}
