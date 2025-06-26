// components/SkeletonWrapper.tsx
import React from 'react';
import { ScrollView, RefreshControl, View, StyleProp, ViewStyle } from 'react-native';

type Props = {
    loading: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    skeleton: React.ReactNode;
    children: React.ReactNode;
    stickyHeaderIndices?: number[];
    style?: StyleProp<ViewStyle>;
};

const SkeletonWrapper = ({ loading, refreshing, onRefresh, skeleton, children, stickyHeaderIndices, style }: Props) => {
    if (loading) return <>{skeleton}</>;

    return (
        <ScrollView
            refreshControl={
                onRefresh ? (
                    <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
                ) : undefined
            }

            contentContainerStyle={style}
            stickyHeaderIndices={stickyHeaderIndices}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    );
};

export default SkeletonWrapper;
