package com.kingkrass.z1

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kingkrass.z1.network.Z1ApiClient
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.NumberFormat
import java.time.YearMonth
import java.util.Locale

@Composable
fun WindparkDashboard(modifier: Modifier = Modifier) {
    var baseUrl by remember { mutableStateOf("http://10.0.2.2:3001") }
    var token by remember { mutableStateOf("") }
    var month by remember { mutableStateOf(YearMonth.now().toString()) }
    var report by remember { mutableStateOf<WindparkMonth?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier.verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Z1 Windpark-Dashboard", style = MaterialTheme.typography.headlineSmall)
        Text("Monatswerte aus dem Z1-Ledger. Es werden keine fehlenden Werte geschätzt.")

        OutlinedTextField(
            value = baseUrl,
            onValueChange = { baseUrl = it },
            label = { Text("API-Adresse") },
            supportingText = { Text("Emulator lokal: http://10.0.2.2:3001") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = token,
            onValueChange = { token = it },
            label = { Text("Z1-Zugangsschlüssel") },
            visualTransformation = PasswordVisualTransformation(),
            supportingText = { Text("Wird nur im Arbeitsspeicher gehalten und nicht gespeichert.") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = month,
            onValueChange = { month = it },
            label = { Text("Abrechnungsmonat") },
            supportingText = { Text("Format: JJJJ-MM") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            enabled = !loading,
            onClick = {
                loading = true
                error = null
                report = null
                scope.launch {
                    val response = Z1ApiClient(baseUrl, token).getWindparkMonth(month)
                    response.fold(
                        onSuccess = { body ->
                            runCatching { parseWindparkMonth(body) }
                                .onSuccess { report = it }
                                .onFailure { error = it.message ?: "Die API-Antwort konnte nicht gelesen werden." }
                        },
                        onFailure = { error = it.message ?: "Verbindung zur Z1 API fehlgeschlagen." }
                    )
                    loading = false
                }
            }
        ) {
            Text(if (loading) "Lade Monatsdaten …" else "Monat laden")
        }

        error?.let {
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(it, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.error)
            }
        }
        if (loading) CircularProgressIndicator()

        report?.let { data ->
            Text("Übersicht ${data.month}", style = MaterialTheme.typography.titleLarge)
            Text(data.basis, style = MaterialTheme.typography.bodySmall)
            MetricRow(
                "Strom, mit Quellenangabe",
                "${formatInteger(data.documentedProductionKwh)} kWh",
                "Einnahmen, mit Quellenangabe",
                formatMoney(data.documentedIncomeMinor)
            )
            MetricRow(
                "Kosten, mit Quellenangabe",
                formatMoney(data.documentedExpenseMinor),
                "Betriebsergebnis",
                formatMoney(data.documentedOperatingResultMinor)
            )
            MetricRow(
                "Netto-Cashflow, mit Quellenangabe",
                formatMoney(data.documentedNetCashflowMinor),
                "Parks mit Buchungen",
                "${data.parksWithEntries} / ${data.parkCount}"
            )
            MetricRow(
                "Strom, gemeldet",
                "${formatInteger(data.reportedProductionKwh)} kWh",
                "Einnahmen / Kosten, gemeldet",
                "${formatMoney(data.reportedIncomeMinor)} / ${formatMoney(data.reportedExpenseMinor)}"
            )

            if (data.parks.isEmpty()) {
                Text("Für diesen Monat sind noch keine Windparks erfasst.")
            } else {
                Text("Windparks", style = MaterialTheme.typography.titleLarge)
                data.parks.forEach { park ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(park.name, style = MaterialTheme.typography.titleMedium)
                            Text(park.location)
                            Text("Eigentum: Nutzerangabe, ungeprüft")
                            Text(
                                "Belegte Einnahmen ${formatMoney(park.incomeMinor)} · " +
                                    "belegte Kosten ${formatMoney(park.expenseMinor)}"
                            )
                            Text(
                                "Gemeldeter Cashflow ${formatMoney(park.reportedCashflowMinor)} · " +
                                    "fehlende Kennzahlen: ${park.missingMetricCount}"
                            )
                        }
                    }
                }
            }
            Text(
                "Die Anzeige summiert erfasste Buchungen. Quellenangaben und Beträge werden von der API nicht unabhängig geprüft.",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun MetricRow(label1: String, value1: String, label2: String, value2: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        MetricCard(label1, value1, Modifier.weight(1f))
        MetricCard(label2, value2, Modifier.weight(1f))
    }
}

@Composable
private fun MetricCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.titleMedium)
        }
    }
}

private data class WindparkMonth(
    val month: String,
    val basis: String,
    val parkCount: Int,
    val parksWithEntries: Int,
    val documentedProductionKwh: Long,
    val reportedProductionKwh: Long,
    val documentedIncomeMinor: Long,
    val documentedExpenseMinor: Long,
    val documentedOperatingResultMinor: Long,
    val documentedNetCashflowMinor: Long,
    val reportedIncomeMinor: Long,
    val reportedExpenseMinor: Long,
    val parks: List<WindparkRow>
)

private data class WindparkRow(
    val name: String,
    val location: String,
    val incomeMinor: Long,
    val expenseMinor: Long,
    val reportedCashflowMinor: Long,
    val missingMetricCount: Int
)

private fun parseWindparkMonth(json: String): WindparkMonth {
    val root = JSONObject(json)
    val totals = root.getJSONObject("totals")
    val parks = root.optJSONArray("parks")
    val rows = buildList {
        if (parks != null) {
            for (index in 0 until parks.length()) {
                val item = parks.getJSONObject(index)
                val park = item.optJSONObject("park") ?: JSONObject()
                add(
                    WindparkRow(
                        name = park.optString("name", "Unbenannter Park"),
                        location = park.optString("location", "Standort nicht angegeben"),
                        incomeMinor = item.optLong("documentedIncomeMinor"),
                        expenseMinor = item.optLong("documentedExpenseMinor"),
                        reportedCashflowMinor = item.optLong("reportedNetCashflowMinor"),
                        missingMetricCount = item.optInt("missingMetricCount")
                    )
                )
            }
        }
    }
    return WindparkMonth(
        month = root.optString("month"),
        basis = root.optString("basis", "Erfasste Buchungen; keine Hochrechnung"),
        parkCount = totals.optInt("parkCount"),
        parksWithEntries = totals.optInt("parksWithEntries"),
        documentedProductionKwh = totals.optLong("documentedProductionKwh"),
        reportedProductionKwh = totals.optLong("reportedProductionKwh"),
        documentedIncomeMinor = totals.optLong("documentedIncomeMinor"),
        documentedExpenseMinor = totals.optLong("documentedExpenseMinor"),
        documentedOperatingResultMinor = totals.optLong("documentedOperatingResultMinor"),
        documentedNetCashflowMinor = totals.optLong("documentedNetCashflowMinor"),
        reportedIncomeMinor = totals.optLong("reportedIncomeMinor"),
        reportedExpenseMinor = totals.optLong("reportedExpenseMinor"),
        parks = rows
    )
}

private fun formatMoney(amountMinor: Long): String =
    NumberFormat.getCurrencyInstance(Locale.GERMANY).format(amountMinor / 100.0)

private fun formatInteger(value: Long): String =
    NumberFormat.getIntegerInstance(Locale.GERMANY).format(value)
