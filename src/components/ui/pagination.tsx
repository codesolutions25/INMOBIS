import * as React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

interface MuiPaginationProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  className?: string;
  variant?: "text" | "outlined";
  shape?: "rounded" | "circular";
  showFirstButton?: boolean;
  showLastButton?: boolean;
  color?: 'primary' | 'secondary' | 'standard';
  size?: 'small' | 'medium' | 'large';
}

export default function MuiPagination({
  count,
  page,
  onChange,
  className,
  variant = "outlined",
  shape = "rounded",
  showFirstButton,
  showLastButton,
  color = "primary",
  size = "medium"
}: MuiPaginationProps) {
  return (
    <Stack spacing={2} className={className}>
      <Pagination
        count={count}
        page={page}
        onChange={onChange}
        variant={variant}
        shape={shape}
        color={color}
        size={size}
        showFirstButton={showFirstButton}
        showLastButton={showLastButton}
      />
    </Stack>
  );
}