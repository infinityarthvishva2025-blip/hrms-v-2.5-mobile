import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const AppDropdown = ({ 
  label, 
  options, 
  value, 
  onSelect, 
  placeholder = 'Select option',
  icon = 'chevron-down-outline'
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={styles.trigger} 
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          {selectedOption?.icon && (
            <Ionicons 
              name={selectedOption.icon} 
              size={18} 
              color={selectedOption.color || colors.primary} 
              style={styles.icon} 
            />
          )}
          <Text style={[styles.valueText, !value && { color: colors.textTertiary }]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Ionicons name={icon} size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.option, item.value === value && styles.selectedOption]} 
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIconBg, { backgroundColor: item.color + '15' }]}>
                       <Ionicons name={item.icon || 'ellipse'} size={18} color={item.color || colors.primary} />
                    </View>
                    <Text style={[styles.optionLabel, item.value === value && styles.selectedLabel]}>
                      {item.label}
                    </Text>
                  </View>
                  {item.value === value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16, width: '100%' },
  label: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
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
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  valueText: { fontSize: 15, fontWeight: '600', color: colors.text },
  
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: height * 0.6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surfaceAlt },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  selectedOption: { backgroundColor: colors.primary + '05' },
  selectedLabel: { color: colors.primary },
});

export default AppDropdown;
