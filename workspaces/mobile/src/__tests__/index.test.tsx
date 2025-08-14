import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Simple component for testing
const TestComponent = () => (
  <View>
    <Text>Hello Mobile</Text>
  </View>
);

describe('Mobile App', () => {
  it('should render test component', () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText('Hello Mobile')).toBeTruthy();
  });

  it('should handle basic rendering', () => {
    const { container } = render(<TestComponent />);
    expect(container).toBeTruthy();
  });
});