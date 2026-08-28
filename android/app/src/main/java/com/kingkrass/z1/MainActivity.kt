package com.kingkrass.z1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kingkrass.z1.core.CouncilRegistry
import com.kingkrass.z1.core.ContinuityStore
import com.kingkrass.z1.network.Z1ApiClient

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = ContinuityStore(applicationContext)
        val registry = CouncilRegistry()
        val api = Z1ApiClient()
        setContent { Z1App(store, registry, api) }
    }
}

@Composable
private fun Z1App(store: ContinuityStore, registry: CouncilRegistry, api: Z1ApiClient) {
    var state by remember { mutableStateOf(store.state) }
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("🦁 Z1 PLATFORM", style = MaterialTheme.typography.headlineMedium)
                Text("Z1 bewahrt. Zoë interpretiert. Die 33 spezialisieren. MCP vermittelt. Das Modell rechnet.")
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Zoë Continuity", style = MaterialTheme.typography.titleLarge)
                        Text("Identity: ${store.identity}")
                        Text("State: $state")
                        Text("Council: ${registry.agents.size} persistente Agenten")
                        Text("Invariant: agent_id ≠ model_id")
                    }
                }
                Button(onClick = {
                    store.setState("SYNC REQUESTED")
                    state = store.state
                }) { Text("Z1 synchronisieren") }
            }
        }
    }
}
