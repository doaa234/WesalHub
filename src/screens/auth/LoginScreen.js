import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { useTranslation } from '../../i18n';

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t, isRTL } = useTranslation();
  
  const handleLogin = async () => {
    // Validate inputs
    if (!identifier.trim()) {
      setError(t('login.errorEmailRequired'));
      setSnackbarVisible(true);
      return;
    }
    
    if (!password) {
      setError(t('login.errorPasswordRequired'));
      setSnackbarVisible(true);
      return;
    }
    
    setLoading(true);
    
    try {
      // Call login action from Redux
      const result = await dispatch(login({ identifier, password, rememberMe })).unwrap();
      
      // Navigation will be handled by the auth state listener in App.js
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message || t('login.errorGeneric'));
      setSnackbarVisible(true);
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };
  
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  const handleCreateAccount = () => {
    navigation.navigate('Register');
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            {t('login.title')}
          </Text>
          
          <TextInput
            label={t('login.identifierLabel')}
            value={identifier}
            onChangeText={setIdentifier}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />
          
          <TextInput
            label={t('login.passwordLabel')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={toggleShowPassword}
              />
            }
          />
          
          <View style={styles.rememberContainer}>
            <TouchableOpacity 
              style={styles.rememberMeRow} 
              onPress={toggleRememberMe}
            >
              <IconButton
                icon={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                onPress={toggleRememberMe}
                color={theme.colors.primary}
              />
              <Text>{t('login.rememberMe')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
                {t('login.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={loading}
            disabled={loading}
          >
            {t('login.loginButton')}
          </Button>
          
          <View style={styles.createAccountContainer}>
            <Text>{t('login.noAccount')}</Text>
            <TouchableOpacity onPress={handleCreateAccount}>
              <Text style={[styles.createAccountText, { color: theme.colors.primary }]}>
                {t('login.createAccount')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: t('common.dismiss'),
          onPress: () => setSnackbarVisible(false),
        }}
        duration={3000}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  createAccountText: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default LoginScreen;