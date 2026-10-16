package com.kingkrass.z1.core

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

class ContinuityStore(context: Context) {
    private val prefs = context.getSharedPreferences("z1_continuity", Context.MODE_PRIVATE)
    val identity: String = prefs.getString("identity", "zoe-core-v1") ?: "zoe-core-v1"
    private val stateValue = mutableStateOf(prefs.getString("state", "OPERATIONAL") ?: "OPERATIONAL")
    val state: String
        get() = stateValue.value

    fun setState(value: String) {
        stateValue.value = value
        prefs.edit().putString("state", value).apply()
    }
}
