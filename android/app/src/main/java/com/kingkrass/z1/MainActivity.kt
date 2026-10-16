package com.kingkrass.z1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kingkrass.z1.communication.InHouseCommunicationPlugin
import com.kingkrass.z1.core.CouncilRegistry
import com.kingkrass.z1.core.ContinuityStore
import com.kingkrass.z1.network.Z1ApiClient

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = ContinuityStore(applicationContext)
        val registry = CouncilRegistry()
        val api = Z1ApiClient()
        val communication = InHouseCommunicationPlugin()
        setContent { Z1App(store, registry, api, communication) }
    }
}

@Composable
private fun Z1App(
    store: ContinuityStore,
    registry: CouncilRegistry,
    api: Z1ApiClient,
    communication: InHouseCommunicationPlugin
) {
    var state by remember { mutableStateOf(store.state) }
    var recipient by remember { mutableStateOf("zoe-core") }
    var expanded by remember { mutableStateOf(false) }
    var subject by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var feedback by remember { mutableStateOf("") }
    val messages by communication.messages.collectAsState()

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
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

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Interne Z1-Kommunikation", style = MaterialTheme.typography.titleLarge)
                        Text(
                            "Nachrichten zwischen Zoë, Z1-Core, Fachmodulen und den 33 Rollen.",
                            style = MaterialTheme.typography.bodyMedium
                        )

                        Box {
                            OutlinedButton(onClick = { expanded = true }) {
                                Text("Empfänger: $recipient")
                            }
                            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                communication.destinations.forEach { module ->
                                    DropdownMenuItem(
                                        text = { Text(module) },
                                        onClick = {
                                            recipient = module
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = subject,
                            onValueChange = { subject = it },
                            label = { Text("Betreff") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = body,
                            onValueChange = { body = it },
                            label = { Text("Nachricht") },
                            minLines = 2,
                            maxLines = 5,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Button(onClick = {
                            val result = communication.send(
                                sender = "z1-core",
                                recipient = recipient,
                                subject = subject,
                                body = body
                            )
                            feedback = result.fold(
                                onSuccess = { "Nachricht lokal an ${it.recipient} übergeben." },
                                onFailure = { it.message ?: "Nachricht konnte nicht gesendet werden." }
                            )
                            if (result.isSuccess) {
                                subject = ""
                                body = ""
                            }
                        }) {
                            Text("Intern senden")
                        }
                        if (feedback.isNotBlank()) {
                            Text(feedback, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(
                            "Prototyp: Nachrichten bleiben flüchtig auf diesem Gerät. Es besteht noch keine Verbindung zum Z1-Server.",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Letzte interne Nachrichten", style = MaterialTheme.typography.titleMedium)
                        if (messages.isEmpty()) {
                            Text("Noch keine Nachrichten.")
                        } else {
                            messages.takeLast(10).reversed().forEach { message ->
                                HorizontalDivider()
                                Text("${message.sender} → ${message.recipient}", style = MaterialTheme.typography.labelMedium)
                                if (message.subject.isNotBlank()) Text(message.subject, style = MaterialTheme.typography.titleSmall)
                                Text(message.body, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}
