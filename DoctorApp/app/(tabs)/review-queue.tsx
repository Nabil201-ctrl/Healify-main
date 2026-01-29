import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDoctorReviewQueue } from '../../services/DoctorAuthService';
import { SessionCard } from '../../components/SessionCard';
import { useAuth } from '../../context/DoctorAuthContext';
import tw from 'twrnc';

export default function ReviewQueueScreen() {
    const { doctor } = useAuth();

    const { data: sessions, refetch, isLoading, isError } = useQuery({
        queryKey: ['review-queue'],
        queryFn: getDoctorReviewQueue,
        refetchInterval: 30000 // Auto-refresh every 30s
    });

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <View style={tw`bg-white pt-12 pb-4 px-4 border-b border-gray-200 shadow-sm`}>
                <Text style={tw`text-2xl font-bold text-gray-900`}>Review Queue</Text>
                <Text style={tw`text-sm text-gray-500 mt-1`}>
                    Welcome back, Dr. {doctor?.lastName}
                </Text>
            </View>

            {isLoading && !sessions ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={sessions || []}
                    keyExtractor={item => item.sessionId}
                    renderItem={({ item }) => <SessionCard session={item} />}
                    contentContainerStyle={tw`p-4`}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563eb" />
                    }
                    ListEmptyComponent={
                        <View style={tw`flex-1 justify-center items-center py-20`}>
                            <Text style={tw`text-4xl mb-4`}>✅</Text>
                            <Text style={tw`text-lg font-semibold text-gray-700`}>All Caught Up!</Text>
                            <Text style={tw`text-gray-500 mt-2`}>No sessions currently need review.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
