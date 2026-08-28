package com.kingkrass.z1.core

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

class ContinuityStore(context: Context) {
    private val prefs = context.getSharedPreferences("z1_continuity", Context.MODE_PRIVATE)
    val identity: String = prefs.getString("identity", "zoe-core-v1") ?: "zoe-core-v1"
    var state: String by mutableStateOf(prefs.getString("state", "OPERATIONAL") ?: "OPERATIONAL")
        private set

    fun setState(value: String) {
        state = value
        prefs.edit().putString("state", value).apply()
    }
}
