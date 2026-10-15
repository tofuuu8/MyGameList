import AuthLayout from '../components/AuthLayout';
import ReleaseList from '../components/ReleaseList';
import { releases } from '../releases';

// The full history of updates.
export default function WhatsNewScreen({ navigation }) {
  return (
    <AuthLayout onBack={() => navigation.goBack()} title="What's new" subtitle="Everything that has changed in the app, newest first.">
      <ReleaseList items={releases} />
    </AuthLayout>
  );
}
