import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AppDateTimePicker = ({ 
  label, 
  value, 
  onChange, 
  mode = 'date', 
  placeholder = 'Select',
  icon = 'calendar-outline'
}) => {
  const [show, setShow] = useState(false);
  
  const formatValue = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (mode === 'date') {
      return d.toISOString().split('T')[0];
    } else {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={styles.trigger} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, !value && { color: colors.textTertiary }]}>
          {value ? formatValue(value) : placeholder}
        </Text>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          is24Hour={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

export default AppDateTimePicker;
