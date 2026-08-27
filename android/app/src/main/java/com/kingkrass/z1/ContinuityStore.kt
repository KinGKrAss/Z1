package com.kingkrass.z1

import android.content.Context
import org.json.JSONObject

class ContinuityStore(context: Context) {
    private val prefs = context.getSharedPreferences("z1_continuity", Context.MODE_PRIVATE)

    fun load(): ContinuityState = ContinuityState(
        identityVersion = prefs.getString("identity_version", "1.0") ?: "1.0",
        stateVersion = prefs.getLong("state_version", 1L),
        legacyRef = prefs.getString("legacy_ref", "zoe://legacy/default") ?: "zoe://legacy/default",
        authorized = prefs.getBoolean("authorized", false)
    )

    fun save(state: ContinuityState) {
        prefs.edit()
            .putString("identity_version", state.identityVersion)
            .putLong("state_version", state.stateVersion)
            .putString("legacy_ref", state.legacyRef)
            .putBoolean("authorized", state.authorized)
            .apply()
    }

    fun exportJson(): String {
        val s = load()
        return JSONObject()
            .put("identity_version", s.identityVersion)
            .put("state_version", s.stateVersion)
            .put("legacy_ref", s.legacyRef)
            .put("authorized", s.authorized)
            .toString()
    }
}
