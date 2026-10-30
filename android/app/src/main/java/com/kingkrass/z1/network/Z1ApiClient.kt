package com.kingkrass.z1.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

class Z1ApiClient(
    private val baseUrl: String,
    private val accessToken: String,
    private val client: OkHttpClient = OkHttpClient()
) {
    suspend fun getWindparkMonth(month: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            require(month.matches(Regex("\\d{4}-(0[1-9]|1[0-2])"))) {
                "Bitte einen Monat im Format JJJJ-MM eingeben."
            }
            require(accessToken.isNotBlank()) { "Bitte den Z1-Zugangsschlüssel eingeben." }

            val root = baseUrl.trim().trimEnd('/').toHttpUrlOrNull()
                ?: error("Die API-Adresse ist ungültig.")
            val isLocalHttp = root.scheme == "http" &&
                root.host in setOf("10.0.2.2", "localhost", "127.0.0.1")
            require(root.scheme == "https" || isLocalHttp) {
                "Für entfernte Server ist HTTPS erforderlich. HTTP ist nur für lokale Entwicklung erlaubt."
            }

            val url = root.newBuilder()
                .addPathSegments("api/z1/windparks")
                .addQueryParameter("month", month)
                .build()
            val request = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $accessToken")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val message = when (response.code) {
                        401 -> "Zugangsschlüssel abgelehnt."
                        403 -> "Der Zugang hat keine Leseberechtigung."
                        503 -> "Die Windpark-API ist auf dem Server nicht eingerichtet."
                        else -> "Z1 API antwortet mit HTTP ${response.code}."
                    }
                    error(message)
                }
                body.ifBlank { error("Die API hat eine leere Antwort gesendet.") }
            }
        }
    }
}
