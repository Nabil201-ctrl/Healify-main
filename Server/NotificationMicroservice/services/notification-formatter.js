/**
 * Format notifications based on type
 * Creates user-friendly notification messages for different event types
 */

/**
 * Format health alert notification
 * @param {object} data - Health alert data
 * @returns {object} Formatted notification
 */
export function formatHealthAlert(data) {
    const { metric, value, threshold, severity } = data;

    let title = '⚠️ Health Alert';
    let body = `Your ${metric} is ${value}`;

    if (severity === 'high') {
        title = '🚨 Urgent Health Alert';
        body = `Your ${metric} (${value}) is significantly ${value > threshold ? 'above' : 'below'} normal. Please consult a healthcare provider.`;
    } else if (severity === 'medium') {
        title = '⚠️ Health Alert';
        body = `Your ${metric} (${value}) is ${value > threshold ? 'higher' : 'lower'} than recommended. Monitor closely.`;
    } else {
        title = 'ℹ️ Health Notice';
        body = `Your ${metric} reading: ${value}`;
    }

    return {
        title,
        body,
        data: {
            type: 'health_alert',
            metric,
            value: String(value),
            severity,
        },
    };
}

/**
 * Format chat message notification
 * @param {object} data - Chat message data
 * @returns {object} Formatted notification
 */
export function formatChatMessage(data) {
    const { sender, message, sessionId } = data;

    let title = '💬 New Message';
    let body = message;

    if (sender === 'ai') {
        title = '🤖 AI Response';
        body = message.length > 100 ? message.substring(0, 100) + '...' : message;
    } else if (sender === 'doctor') {
        title = '👨‍⚕️ Doctor Message';
        body = message.length > 100 ? message.substring(0, 100) + '...' : message;
    }

    return {
        title,
        body,
        data: {
            type: 'chat_message',
            sender,
            sessionId,
        },
    };
}

/**
 * Format appointment reminder notification
 * @param {object} data - Appointment data
 * @returns {object} Formatted notification
 */
export function formatAppointmentReminder(data) {
    const { appointmentType, time, doctorName } = data;

    const title = '📅 Appointment Reminder';
    const body = `${appointmentType} with ${doctorName || 'your doctor'} at ${time}`;

    return {
        title,
        body,
        data: {
            type: 'appointment_reminder',
            appointmentType,
            time,
        },
    };
}

/**
 * Format medication reminder notification
 * @param {object} data - Medication data
 * @returns {object} Formatted notification
 */
export function formatMedicationReminder(data) {
    const { medicationName, dosage, time } = data;

    const title = '💊 Medication Reminder';
    const body = `Time to take ${medicationName}${dosage ? ` (${dosage})` : ''}`;

    return {
        title,
        body,
        data: {
            type: 'medication_reminder',
            medicationName,
            time,
        },
    };
}

/**
 * Format generic notification
 * @param {object} data - Notification data
 * @returns {object} Formatted notification
 */
export function formatGenericNotification(data) {
    const { title, body, ...rest } = data;

    return {
        title: title || 'Healify',
        body: body || 'You have a new notification',
        data: {
            type: 'generic',
            ...rest,
        },
    };
}

/**
 * Main formatter function - routes to specific formatter based on type
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @returns {object} Formatted notification
 */
export function formatNotification(type, data) {
    switch (type) {
        case 'health_alert':
            return formatHealthAlert(data);
        case 'chat_message':
            return formatChatMessage(data);
        case 'appointment_reminder':
            return formatAppointmentReminder(data);
        case 'medication_reminder':
            return formatMedicationReminder(data);
        default:
            return formatGenericNotification(data);
    }
}
