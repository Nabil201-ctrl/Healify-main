import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/DoctorAuthContext';
import tw from 'twrnc';

export default function ProfileScreen() {
    const { doctor, logout } = useAuth();

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            <View style={tw`bg-white pt-12 pb-6 px-4 border-b border-gray-200 items-center`}>
                <View style={tw`w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                    <Text style={tw`text-4xl`}>👨‍⚕️</Text>
                </View>
                <Text style={tw`text-2xl font-bold text-gray-900`}>
                    Dr. {doctor?.firstName} {doctor?.lastName}
                </Text>
                <Text style={tw`text-blue-600 font-medium mt-1`}>
                    {doctor?.specialization || 'General Practitioner'}
                </Text>
                <Text style={tw`text-gray-500 text-sm mt-1`}>{doctor?.email}</Text>
            </View>

            <View style={tw`p-4`}>
                <View style={tw`bg-white rounded-xl shadow-sm overflow-hidden mb-6`}>
                    <View style={tw`p-4 border-b border-gray-100`}>
                        <Text style={tw`text-gray-500 text-xs uppercase font-bold mb-1`}>License Number</Text>
                        <Text style={tw`text-gray-900 font-medium`}>DOC-8829-XJ</Text>
                    </View>
                    <View style={tw`p-4 border-b border-gray-100`}>
                        <Text style={tw`text-gray-500 text-xs uppercase font-bold mb-1`}>Status</Text>
                        <View style={tw`flex-row items-center`}>
                            <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
                            <Text style={tw`text-green-600 font-medium`}>Active & Accepting Reviews</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={tw`bg-red-50 p-4 rounded-xl items-center border border-red-100`}
                    onPress={logout}
                >
                    <Text style={tw`text-red-600 font-bold`}>Log Out</Text>
                </TouchableOpacity>

                <Text style={tw`text-center text-gray-400 text-xs mt-8`}>
                    Healify Doctor Portal v1.0.0
                </Text>
            </View>
        </View>
    );
}
