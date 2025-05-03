import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useTranslation } from '../../i18n';

const Header = ({ title, showBackButton, onBackPress, rightActions }) => {
  const { colors } = useTheme();
  const { isRTL } = useTranslation();
  
  return (
    <Appbar.Header style={{ backgroundColor: colors.surface }}>
      {showBackButton && (
        <Appbar.BackAction
          onPress={onBackPress}
          style={isRTL ? styles.backButtonRTL : {}}
        />
      )}
      <Appbar.Content
        title={title}
        titleStyle={isRTL ? styles.titleRTL : {}}
      />
      {rightActions}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  backButtonRTL: {
    transform: [{ scaleX: -1 }],
  },
  titleRTL: {
    alignSelf: 'flex-end',
  },
});

export default Header;