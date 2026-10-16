package com.kingkrass.z1.communication

import java.time.Instant
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * In-app message bus for Z1 modules.
 *
 * This prototype keeps messages in memory on this Android device. It does not
 * contact remote AI providers or a Z1 server.
 */
data class InternalModuleMessage(
    val id: String,
    val sender: String,
    val recipient: String,
    val subject: String,
    val body: String,
    val createdAt: String
)

class InHouseCommunicationPlugin {
    val destinations: List<String> = buildList {
        add("zoe-core")
        add("z1-core")
        add("gaia")
        add("fortuna")
        add("electra")
        add("diplomatie")
        addAll((1..33).map { "council-${it.toString().padStart(2, '0')}" })
    }

    private val _messages = MutableStateFlow<List<InternalModuleMessage>>(emptyList())
    val messages: StateFlow<List<InternalModuleMessage>> = _messages.asStateFlow()

    fun send(
        sender: String,
        recipient: String,
        subject: String,
        body: String
    ): Result<InternalModuleMessage> {
        val cleanSender = sender.trim().lowercase()
        val cleanRecipient = recipient.trim().lowercase()
        val cleanSubject = subject.trim()
        val cleanBody = body.trim()

        if (cleanSender !in destinations) return Result.failure(IllegalArgumentException("Unbekannter Absender."))
        if (cleanRecipient !in destinations) return Result.failure(IllegalArgumentException("Unbekannter Empfänger."))
        if (cleanSender == cleanRecipient) return Result.failure(IllegalArgumentException("Absender und Empfänger müssen verschieden sein."))
        if (cleanBody.isBlank()) return Result.failure(IllegalArgumentException("Bitte eine Nachricht eingeben."))
        if (cleanSubject.length > 120 || cleanBody.length > 2000) {
            return Result.failure(IllegalArgumentException("Betreff oder Nachricht ist zu lang."))
        }

        val message = InternalModuleMessage(
            id = UUID.randomUUID().toString(),
            sender = cleanSender,
            recipient = cleanRecipient,
            subject = cleanSubject,
            body = cleanBody,
            createdAt = Instant.now().toString()
        )
        _messages.value = (_messages.value + message).takeLast(100)
        return Result.success(message)
    }
}
