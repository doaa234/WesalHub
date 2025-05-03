import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useTranslation } from '../../i18n';

const PendingApprovalScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/pending-approval.png')}
          style={styles.image}
          resizeMode="contain"
        />
        
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('pendingApproval.title', 'Registration Submitted')}
        </Text>
        
        <Text style={[styles.message, { color: colors.text }]}>
          {t('pendingApproval.message', 'Your account registration has been submitted successfully. An administrator will review your information and approve your account. You will receive an email notification once your account is approved.')}
        </Text>
        
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        >
          {t('pendingApproval.backToLogin', 'Back to Login')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 8,
  },
});

export default PendingApprovalScreen;