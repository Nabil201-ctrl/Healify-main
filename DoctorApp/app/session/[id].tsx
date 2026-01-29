import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientHealthCard } from '../../components/PatientHealthCard';
import { DoctorChatInterface } from '../../components/DoctorChatInterface';
import { assignSessionToMe, completeReview } from '../../services/DoctorAuthService';
import tw from 'twrnc';

// Helper to fetch full session details including health data
const getSessionDetails = async (sessionId: string) => {
    const token = await AsyncStorage.getItem('doctorAccessToken');
    const API_URL = 'http://localhost:3001';

    // Get health data via the doctor endpoint
    const response = await axios.get(`${API_URL}/doctor/patient-health/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
};

export default function SessionDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [reviewNotes, setReviewNotes] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);

    const { data: sessionData, isLoading } = useQuery({
        queryKey: ['session-full', id],
        queryFn: () => getSessionDetails(id as string),
        enabled: !!id
    });

    const assignMutation = useMutation({
        mutationFn: () => assignSessionToMe(id as string),
        onSuccess: () => {
            Alert.alert('Success', 'Session assigned to you');
            queryClient.invalidateQueries({ queryKey: ['review-queue'] });
        },
        onError: (err: any) => {
            Alert.alert('Error', err.message);
        }
    });

    const completeMutation = useMutation({
        mutationFn: () => completeReview(id as string, reviewNotes),
        onSuccess: () => {
            Alert.alert('Review Completed', 'Session has been marked as reviewed');
            queryClient.invalidateQueries({ queryKey: ['review-queue'] });
            router.back();
        },
        onError: (err: any) => {
            Alert.alert('Error', err.message);
        }
    });

    if (isLoading) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const patientData = sessionData?.patient;

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <ScrollView style={tw`flex-1`}>
                {/* Patient Health Summary */}
                <PatientHealthCard data={patientData} />

                {/* Chat Interface Container */}
                <View style={tw`h-[400px] px-4 mb-4`}>
                    <DoctorChatInterface sessionId={id as string} />
                </View>

                {/* Review Actions */}
                <View style={tw`p-4 bg-white border-t border-gray-200 pb-10`}>
                    <Text style={tw`text-lg font-bold mb-3 text-gray-800`}>Doctor Actions</Text>

                    {!isReviewing ? (
                        <View style={tw`flex-row gap-3`}>
                            <TouchableOpacity
                                style={tw`flex-1 bg-blue-600 p-4 rounded-xl shadow-sm`}
                                onPress={() => assignMutation.mutate()}
                                disabled={assignMutation.isPending}
                            >
                                <Text style={tw`text-white text-center font-bold`}>
                                    {assignMutation.isPending ? 'Assigning...' : 'Assign to Me'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={tw`flex-1 bg-green-600 p-4 rounded-xl shadow-sm`}
                                onPress={() => setIsReviewing(true)}
                            >
                                <Text style={tw`text-white text-center font-bold`}>
                                    Complete Review
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={tw`text-sm text-gray-600 mb-2`}>Review Notes (Optional)</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg p-3 h-24 mb-3 bg-gray-50`}
                                multiline
                                placeholder="Add clinical notes about this review..."
                                value={reviewNotes}
                                onChangeText={setReviewNotes}
                                textAlignVertical="top"
                            />

                            <View style={tw`flex-row gap-3`}>
                                <TouchableOpacity
                                    style={tw`flex-1 bg-gray-200 p-4 rounded-xl`}
                                    onPress={() => setIsReviewing(false)}
                                >
                                    <Text style={tw`text-gray-700 text-center font-bold`}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={tw`flex-1 bg-green-600 p-4 rounded-xl shadow-sm`}
                                    onPress={() => completeMutation.mutate()}
                                    disabled={completeMutation.isPending}
                                >
                                    <Text style={tw`text-white text-center font-bold`}>
                                        {completeMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
