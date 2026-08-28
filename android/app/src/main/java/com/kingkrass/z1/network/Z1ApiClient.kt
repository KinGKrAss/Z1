package com.kingkrass.z1.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

class Z1ApiClient(
    private val baseUrl: String = "https://z1-api.invalid/api/v1",
    private val client: OkHttpClient = OkHttpClient()
) {
    suspend fun get(path: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder().url(baseUrl.trimEnd('/') + "/" + path.trimStart('/')).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) error("Z1 API HTTP ${response.code}")
                response.body?.string() ?: ""
            }
        }
    }
}
