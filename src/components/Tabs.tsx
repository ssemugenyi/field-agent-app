import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { space } from '../theme/spacing';
import { Text } from './Text';

export type TabsProps = {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export function Tabs({ tabs, activeIndex, onChange }: TabsProps) {
  return (
    <View style={styles.row}>
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(index)}
            style={styles.tab}
          >
            <Text size="sm" weight={active ? 'semibold' : 'medium'} color={active ? 'primary' : 'textMuted'}>
              {tab}
            </Text>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm + 2,
  },
  indicator: {
    marginTop: space.xs,
    height: 3,
    width: '60%',
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});
