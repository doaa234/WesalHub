import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Card, Title, Paragraph, Button, IconButton, Badge, Divider, Avatar } from 'react-native-paper';
import { useTranslation } from '../../i18n';

const SecurityDashboard = () => {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingVisitors, setPendingVisitors] = useState(5);
  const [activeAlerts, setActiveAlerts] = useState(2);
  const [recentIncidents, setRecentIncidents] = useState([
    { id: 1, type: 'Unauthorized Access', location: 'Gate 2', time: '10:30 AM', status: 'Resolved' },
    { id: 2, type: 'Fire Alarm', location: 'Building C', time: '2:15 PM', status: 'In Progress' },
    { id: 3, type: 'Suspicious Activity', location: 'Parking Area', time: 'Yesterday', status: 'Under Investigation' },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data fetching
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('security.dashboardTitle', 'Security Dashboard')}
        </Text>
        <IconButton
          icon="bell"
          size={24}
          color={colors.primary}
          onPress={() => {}}
          style={styles.notificationIcon}
        />
        {activeAlerts > 0 && (
          <Badge style={styles.badge}>{activeAlerts}</Badge>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.primary }}>{pendingVisitors}</Title>
            <Paragraph style={{ color: colors.text }}>
              {t('security.pendingVisitors', 'Pending Visitors')}
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="text"
              onPress={() => {}}
              color={colors.primary}
            >
              {t('common.view', 'View')}
            </Button>
          </Card.Actions>
        </Card>

        <Card style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.error }}>{activeAlerts}</Title>
            <Paragraph style={{ color: colors.text }}>
              {t('security.activeAlerts', 'Active Alerts')}
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="text"
              onPress={() => {}}
              color={colors.error}
            >
              {t('common.respond', 'Respond')}
            </Button>
          </Card.Actions>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('security.quickActions', 'Quick Actions')}
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {}}
          >
            <IconButton icon="account-check" color="#fff" size={24} />
            <Text style={styles.actionText}>
              {t('security.verifyVisitor', 'Verify Visitor')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => {}}
          >
            <IconButton icon="alert" color="#fff" size={24} />
            <Text style={styles.actionText}>
              {t('security.reportIncident', 'Report Incident')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.notification }]}
            onPress={() => {}}
          >
            <IconButton icon="shield" color="#fff" size={24} />
            <Text style={styles.actionText}>
              {t('security.patrolLog', 'Patrol Log')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('security.recentIncidents', 'Recent Incidents')}
          </Text>
          <Button
            mode="text"
            onPress={() => {}}
            color={colors.primary}
          >
            {t('common.viewAll', 'View All')}
          </Button>
        </View>
        
        {recentIncidents.map((incident, index) => (
          <Card
            key={incident.id}
            style={[styles.incidentCard, { backgroundColor: colors.surface }]}
          >
            <Card.Content>
              <View style={styles.incidentHeader}>
                <View style={styles.incidentInfo}>
                  <Title style={{ color: colors.text, fontSize: 16 }}>
                    {incident.type}
                  </Title>
                  <Paragraph style={{ color: colors.text, opacity: 0.7 }}>
                    {incident.location} • {incident.time}
                  </Paragraph>
                </View>
                <Badge
                  style={{
                    backgroundColor:
                      incident.status === 'Resolved'
                        ? '#10B981'
                        : incident.status === 'In Progress'
                        ? '#F59E0B'
                        : '#6366F1',
                  }}
                >
                  {incident.status}
                </Badge>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {}}>
                {t('common.details', 'Details')}
              </Button>
              {incident.status !== 'Resolved' && (
                <Button mode="contained" onPress={() => {}} style={{ marginLeft: 8 }}>
                  {t('security.respond', 'Respond')}
                </Button>
              )}
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationIcon: {
    marginRight: 0,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: '31%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  actionText: {
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  incidentCard: {
    marginBottom: 12,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  incidentInfo: {
    flex: 1,
  },
});

export default SecurityDashboard;