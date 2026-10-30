package com.kingkrass.z1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kingkrass.z1.core.CouncilRegistry
import com.kingkrass.z1.core.ContinuityStore

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = ContinuityStore(applicationContext)
        val registry = CouncilRegistry()
        setContent { Z1App(store, registry) }
    }
}

@androidx.compose.runtime.Composable
private fun Z1App(store: ContinuityStore, registry: CouncilRegistry) {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("Z1 PLATFORM", style = MaterialTheme.typography.titleLarge)
                    Card {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text("Zoë Continuity", style = MaterialTheme.typography.titleMedium)
                            Text("Identity: ${store.identity}")
                            Text("State: ${store.state}")
                            Text("Council: ${registry.agents.size} Rollen")
                        }
                    }
                    Text("Windpark-Buchhaltung", style = MaterialTheme.typography.titleMedium)
                }
                HorizontalDivider()
                WindparkDashboard(modifier = Modifier.weight(1f))
            }
        }
    }
}
