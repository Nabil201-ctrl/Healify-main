/**
 * Format notifications based on type
 */

export function formatNotification(
    type: string,
    data: any,
): { title: string; body: string; data?: any } {
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

function formatHealthAlert(data: any) {
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
        data: { type: 'health_alert', metric, value: String(value), severity },
    };
}

function formatChatMessage(data: any) {
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
        data: { type: 'chat_message', sender, sessionId },
    };
}

function formatAppointmentReminder(data: any) {
    const { appointmentType, time, doctorName } = data;

    return {
        title: '📅 Appointment Reminder',
        body: `${appointmentType} with ${doctorName || 'your doctor'} at ${time}`,
        data: { type: 'appointment_reminder', appointmentType, time },
    };
}

function formatMedicationReminder(data: any) {
    const { medicationName, dosage } = data;

    return {
        title: '💊 Medication Reminder',
        body: `Time to take ${medicationName}${dosage ? ` (${dosage})` : ''}`,
        data: { type: 'medication_reminder', medicationName },
    };
}

function formatGenericNotification(data: any) {
    const { title, body, ...rest } = data;

    return {
        title: title || 'Healify',
        body: body || 'You have a new notification',
        data: { type: 'generic', ...rest },
    };
}
