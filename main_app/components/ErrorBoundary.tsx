import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import tw from 'twrnc';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component error occurs
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (in production, you might want to send to error tracking service)
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <View style={tw`flex-1 items-center justify-center p-6 bg-white`}>
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-6xl text-center mb-4`}>⚠️</Text>
                        <Text style={tw`text-2xl font-bold text-gray-800 text-center mb-2`}>
                            Oops! Something went wrong
                        </Text>
                        <Text style={tw`text-base text-gray-600 text-center mb-4`}>
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </Text>
                        {__DEV__ && this.state.error && (
                            <View style={tw`bg-gray-100 p-4 rounded-lg mb-4`}>
                                <Text style={tw`text-sm text-gray-700 font-mono`}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={this.handleReset}
                        style={tw`bg-green-600 px-8 py-4 rounded-xl`}
                        activeOpacity={0.8}
                    >
                        <Text style={tw`text-white text-lg font-semibold`}>
                            Try Again
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
