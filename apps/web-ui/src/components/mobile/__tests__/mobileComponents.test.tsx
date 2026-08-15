import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileCardItem from '../data/MobileCardItem';
import MobileCardList from '../data/MobileCardList';
import MobileStatCard from '../data/MobileStatCard';
import MobileSegmentedTabs from '../navigation/MobileSegmentedTabs';
import MobileStickyActionBar from '../navigation/MobileStickyActionBar';
import MobileFormField from '../forms/MobileFormField';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Mobile UI Components Suite', () => {
  describe('MobileCardItem', () => {
    it('renders title, subtitle, and badge', () => {
      render(
        <MobileCardItem
          title="John Doe"
          subtitle="Grade 10-A"
          badge={{ label: 'Present', color: 'success' }}
          metaItems={[
            { label: 'Roll No', value: '12' },
            { label: 'Attendance', value: '96%' },
          ]}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Grade 10-A')).toBeInTheDocument();
      expect(screen.getByText('Present')).toBeInTheDocument();
      expect(screen.getByText('Roll No')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(
        <MobileCardItem
          title="Clickable Item"
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByText('Clickable Item'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('MobileCardList', () => {
    it('renders empty state when no children', () => {
      render(
        <MobileCardList
          emptyTitle="No Students"
          emptyMessage="No students found in this roster."
        />
      );

      expect(screen.getByText('No Students')).toBeInTheDocument();
      expect(screen.getByText('No students found in this roster.')).toBeInTheDocument();
    });

    it('renders search input and triggers change', () => {
      const handleSearch = vi.fn();
      render(
        <MobileCardList
          searchValue="test"
          onSearchChange={handleSearch}
          searchPlaceholder="Search students..."
        >
          <div>Child item</div>
        </MobileCardList>
      );

      expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument();
    });
  });

  describe('MobileStatCard', () => {
    it('renders title, value, and trend', () => {
      render(
        <MobileStatCard
          title="Total Attendance"
          value="94.5%"
          icon={<span>📊</span>}
          trend={{ value: '+2.4%', isPositive: true }}
        />
      );

      expect(screen.getByText('Total Attendance')).toBeInTheDocument();
      expect(screen.getByText('94.5%')).toBeInTheDocument();
      expect(screen.getByText('+2.4%')).toBeInTheDocument();
    });
  });

  describe('MobileSegmentedTabs', () => {
    it('renders tab options and calls onChange on click', () => {
      const handleChange = vi.fn();
      const options = [
        { id: 'mon', label: 'MON' },
        { id: 'tue', label: 'TUE' },
        { id: 'wed', label: 'WED' },
      ];

      render(
        <MobileSegmentedTabs
          options={options}
          activeId="mon"
          onChange={handleChange}
        />
      );

      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.getByText('TUE')).toBeInTheDocument();

      fireEvent.click(screen.getByText('TUE'));
      expect(handleChange).toHaveBeenCalledWith('tue');
    });
  });

  describe('MobileStickyActionBar', () => {
    it('renders primary button and triggers click', () => {
      const handlePrimary = vi.fn();
      render(
        <MobileStickyActionBar
          primaryLabel="Submit"
          onPrimaryClick={handlePrimary}
        />
      );

      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handlePrimary).toHaveBeenCalledTimes(1);
    });
  });

  describe('MobileFormField', () => {
    it('renders label and input value', () => {
      render(
        <MobileFormField
          label="Student Name"
          value="Alex Morgan"
          onChange={() => { }}
        />
      );

      expect(screen.getByText('Student Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alex Morgan')).toBeInTheDocument();
    });
  });
});
