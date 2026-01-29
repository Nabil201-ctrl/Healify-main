import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';

type Session = {
    sessionId: string;
    anonymousPatientId: string;
    status: string;
    aiConfidence: number;
    reviewReason: string;
    createdAt: string;
    messageCount: number;
    lastMessage?: {
        text: string;
        timestamp: string;
    };
};

export const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
    const router = useRouter();

    const getConfidenceColor = (score: number) => {
        if (score < 0.5) return 'bg-red-100 text-red-800';
        if (score < 0.7) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    return (
        <TouchableOpacity
            style={tw`bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-100`}
            onPress={() => router.push(`/session/${session.sessionId}`)}
        >
            <View style={tw`flex-row justify-between items-start mb-2`}>
                <View style={tw`flex-row items-center`}>
                    <View style={tw`w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3`}>
                        <Text style={tw`text-blue-600 font-bold`}>
                            {session.anonymousPatientId.substring(9, 11)}
                        </Text>
                    </View>
                    <View>
                        <Text style={tw`font-bold text-gray-800 text-base`}>
                            {session.anonymousPatientId}
                        </Text>
                        <Text style={tw`text-xs text-gray-500`}>
                            {new Date(session.createdAt).toLocaleDateString()} • {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

                <View style={tw`px-2 py-1 rounded-full ${getConfidenceColor(session.aiConfidence)}`}>
                    <Text style={tw`text-xs font-bold`}>
                        {(session.aiConfidence * 100).toFixed(0)}% Conf.
                    </Text>
                </View>
            </View>

            {session.reviewReason && (
                <View style={tw`bg-gray-50 p-2 rounded-lg mb-2`}>
                    <Text style={tw`text-xs font-semibold text-gray-500 uppercase mb-1`}>Flagged For</Text>
                    <Text style={tw`text-sm text-gray-800`}>{session.reviewReason}</Text>
                </View>
            )}

            <View style={tw`flex-row justify-between items-center mt-1`}>
                <Text style={tw`text-xs text-gray-500`}>
                    {session.messageCount} messages
                </Text>
                <Text style={tw`text-blue-600 font-medium text-sm`}>Review Case →</Text>
            </View>
        </TouchableOpacity>
    );
};
