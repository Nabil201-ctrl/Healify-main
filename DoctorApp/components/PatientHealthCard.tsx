import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

type HealthData = {
    anonymousId: string;
    ageRange: string;
    gender: string;
    healthMetrics: {
        heartRate: number;
        steps: number;
        sleep: number;
        quality: {
            completeness: number;
            stability: number;
            dataPoints: number;
        };
    };
    recentLogs: any[];
    profile?: {
        bodyType: string;
        height: number;
        weight: number;
        activityLevel: string;
        jobType: string;
        averageSteps: number;
        healthIssues: string[];
        allergies: string[];
        medications: string[];
    };
};

export const PatientHealthCard: React.FC<{ data: HealthData }> = ({ data }) => {
    if (!data) return null;

    const { completeness, stability, dataPoints } = data.healthMetrics?.quality || {};
    const profile = data.profile;

    return (
        <View style={tw`bg-white p-4 m-4 rounded-xl shadow-sm border border-gray-100`}>
            {/* Anonymous Patient Info */}
            <View style={tw`border-b border-gray-100 pb-3 mb-3`}>
                <View style={tw`flex-row items-center mb-2`}>
                    <View style={tw`w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2`}>
                        <Text style={tw`text-blue-600 font-bold text-xs`}>ID</Text>
                    </View>
                    <Text style={tw`text-lg font-bold text-gray-800`}>
                        {data.anonymousId}
                    </Text>
                </View>

                <View style={tw`flex-row flex-wrap`}>
                    <View style={tw`mr-6 mb-2`}>
                        <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>Age Range</Text>
                        <Text style={tw`text-sm font-semibold text-gray-800`}>{data.ageRange}</Text>
                    </View>
                    <View style={tw`mr-6 mb-2`}>
                        <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>Gender</Text>
                        <Text style={tw`text-sm font-semibold text-gray-800`}>{data.gender}</Text>
                    </View>
                    {profile && (
                        <>
                            <View style={tw`mr-6 mb-2`}>
                                <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>Body Type</Text>
                                <Text style={tw`text-sm font-semibold text-gray-800`}>{profile.bodyType}</Text>
                            </View>
                            <View style={tw`mb-2`}>
                                <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>BMI (Est)</Text>
                                <Text style={tw`text-sm font-semibold text-gray-800`}>
                                    {profile.height && profile.weight
                                        ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
                                        : '--'}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Lifestyle Section */}
            {profile && (
                <View style={tw`mb-4`}>
                    <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-2`}>Lifestyle</Text>
                    <View style={tw`flex-row flex-wrap gap-2`}>
                        <View style={tw`bg-gray-50 px-3 py-1 rounded-full`}>
                            <Text style={tw`text-xs text-gray-600`}>Job: {profile.jobType || 'Unknown'}</Text>
                        </View>
                        <View style={tw`bg-gray-50 px-3 py-1 rounded-full`}>
                            <Text style={tw`text-xs text-gray-600`}>Activity: {profile.activityLevel || 'Unknown'}</Text>
                        </View>
                        <View style={tw`bg-gray-50 px-3 py-1 rounded-full`}>
                            <Text style={tw`text-xs text-gray-600`}>Avg Steps: {profile.averageSteps || '--'}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Medical History Section */}
            {profile && (
                <View style={tw`mb-4`}>
                    <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-2`}>Medical Context</Text>

                    {profile.healthIssues?.length > 0 && (
                        <View style={tw`mb-2`}>
                            <Text style={tw`text-xs text-gray-400 mb-1`}>Issues:</Text>
                            <View style={tw`flex-row flex-wrap gap-1`}>
                                {profile.healthIssues.map((issue, i) => (
                                    <View key={i} style={tw`bg-red-50 px-2 py-1 rounded-md border border-red-100`}>
                                        <Text style={tw`text-xs text-red-700`}>{issue}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {profile.allergies?.length > 0 && (
                        <View style={tw`mb-2`}>
                            <Text style={tw`text-xs text-gray-400 mb-1`}>Allergies:</Text>
                            <View style={tw`flex-row flex-wrap gap-1`}>
                                {profile.allergies.map((allergy, i) => (
                                    <View key={i} style={tw`bg-orange-50 px-2 py-1 rounded-md border border-orange-100`}>
                                        <Text style={tw`text-xs text-orange-700`}>{allergy}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {profile.medications?.length > 0 && (
                        <View>
                            <Text style={tw`text-xs text-gray-400 mb-1`}>Meds:</Text>
                            <View style={tw`flex-row flex-wrap gap-1`}>
                                {profile.medications.map((med, i) => (
                                    <View key={i} style={tw`bg-blue-50 px-2 py-1 rounded-md border border-blue-100`}>
                                        <Text style={tw`text-xs text-blue-700`}>{med}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Privacy Notice */}
            <View style={tw`bg-blue-50 p-2 rounded-lg mb-4 border border-blue-100`}>
                <Text style={tw`text-xs text-blue-700 text-center font-medium`}>
                    🔒 Patient identity protected - Anonymous ID only
                </Text>
            </View>

            {/* Health Data Quality */}
            <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-2`}>Data Quality</Text>
            <View style={tw`flex-row justify-between mb-4 bg-gray-50 p-3 rounded-lg`}>
                <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-xl font-bold ${(completeness || 0) > 0.7 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {((completeness || 0) * 100).toFixed(0)}%
                    </Text>
                    <Text style={tw`text-xs text-gray-500`}>Completeness</Text>
                </View>

                <View style={tw`w-px bg-gray-200 mx-2`} />

                <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-xl font-bold ${(stability || 0) > 0.7 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                        {((stability || 0) * 100).toFixed(0)}%
                    </Text>
                    <Text style={tw`text-xs text-gray-500`}>Stability</Text>
                </View>

                <View style={tw`w-px bg-gray-200 mx-2`} />

                <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-xl font-bold text-blue-600`}>
                        {dataPoints || 0}
                    </Text>
                    <Text style={tw`text-xs text-gray-500`}>Data Points</Text>
                </View>
            </View>

            {/* Recent Vitals (Aggregated) */}
            <View style={tw`border-t border-gray-100 pt-3`}>
                <Text style={tw`text-xs text-gray-500 uppercase font-bold mb-2`}>Recent Averages</Text>
                <View style={tw`flex-row justify-between`}>
                    <View style={tw`items-center flex-1 bg-red-50 p-2 rounded-lg mr-2`}>
                        <Text style={tw`text-xs text-red-500 mb-1`}>Heart Rate</Text>
                        <Text style={tw`text-lg font-bold text-red-700`}>
                            {data.healthMetrics?.heartRate || '--'} <Text style={tw`text-xs font-normal`}>bpm</Text>
                        </Text>
                    </View>

                    <View style={tw`items-center flex-1 bg-green-50 p-2 rounded-lg mr-2`}>
                        <Text style={tw`text-xs text-green-500 mb-1`}>Steps</Text>
                        <Text style={tw`text-lg font-bold text-green-700`}>
                            {data.healthMetrics?.steps || '--'}
                        </Text>
                    </View>

                    <View style={tw`items-center flex-1 bg-indigo-50 p-2 rounded-lg`}>
                        <Text style={tw`text-xs text-indigo-500 mb-1`}>Sleep</Text>
                        <Text style={tw`text-lg font-bold text-indigo-700`}>
                            {data.healthMetrics?.sleep || '--'} <Text style={tw`text-xs font-normal`}>h</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
