import React from "react";
// ===== MUI Icons =====
import Dashboard from "@mui/icons-material/Dashboard";
import AccountCircle from "@mui/icons-material/AccountCircle";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Group from "@mui/icons-material/Group";
import MonetizationOn from "@mui/icons-material/MonetizationOn";
import ShowChart from "@mui/icons-material/ShowChart";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import MailOutline from "@mui/icons-material/MailOutline";
import ExitToApp from "@mui/icons-material/ExitToApp";
import Person from "@mui/icons-material/Person";
import VerifiedUser from "@mui/icons-material/VerifiedUser";
import LockIcon from "@mui/icons-material/Lock";
import Inventory from "@mui/icons-material/Inventory";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import History from "@mui/icons-material/History";
import People from "@mui/icons-material/People";
import AccountTree from "@mui/icons-material/AccountTree";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Payments from "@mui/icons-material/Payments";
import Computer from "@mui/icons-material/Computer";
import Laptop from "@mui/icons-material/Laptop";
import PhoneAndroid from "@mui/icons-material/PhoneAndroid";
import DevicesOther from "@mui/icons-material/DevicesOther";
import Build from "@mui/icons-material/Build";
import Support from "@mui/icons-material/Support";
import Announcement from "@mui/icons-material/Announcement";
import Event from "@mui/icons-material/Event";
import RequestQuote from "@mui/icons-material/RequestQuote";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Sms from "@mui/icons-material/Sms";
import Receipt from "@mui/icons-material/Receipt";
import AccountBalance from "@mui/icons-material/AccountBalance";
import Book from "@mui/icons-material/Book";
import Cancel from "@mui/icons-material/Cancel";
import Calculate from "@mui/icons-material/Calculate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Visibility from "@mui/icons-material/Visibility";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import ListAlt from "@mui/icons-material/ListAlt";
import AddCircle from "@mui/icons-material/AddCircle";
import Assessment from "@mui/icons-material/Assessment";
import Savings from "@mui/icons-material/Savings";
// Add missing MUI icons for new menu items
import Refresh from "@mui/icons-material/Refresh";
import BarChart from "@mui/icons-material/BarChart";
import FileCopy from "@mui/icons-material/FileCopy";
import Undo from "@mui/icons-material/Undo";
import Assignment from "@mui/icons-material/Assignment";
import Class from "@mui/icons-material/Class";
import MenuBook from "@mui/icons-material/MenuBook";
import EventNote from "@mui/icons-material/EventNote";
import LocationOn from "@mui/icons-material/LocationOn";
import Schedule from "@mui/icons-material/Schedule";
import Settings from "@mui/icons-material/Settings";
import TableChart from "@mui/icons-material/TableChart";
import Warning from "@mui/icons-material/Warning";
import ArrowBack from "@mui/icons-material/ArrowBack";
import CardMembership from "@mui/icons-material/CardMembership";
import Delete from "@mui/icons-material/Delete";
import Save from "@mui/icons-material/Save";
import Edit from "@mui/icons-material/Edit";
import { CalendarMonth, Create, Notifications } from "@mui/icons-material";
import { Circle, DirectionsBus } from "@mui/icons-material";

export const MuiIcons = {
  Dashboard,
  Create,
  CalendarMonth,
  AccountCircle,
  ExpandLessIcon,
  CheckCircle,
  Group,
  MonetizationOn,
  ShowChart,
  CreditCardIcon,
  MailOutline,
  ExitToApp,
  Person,
  VerifiedUser,
  LockIcon,
  Lock: LockIcon,
  Inventory,
  SwapHoriz,
  History,
  People,
  AccountTree,
  PersonAdd,
  Payments,
  ExpandMore: ExpandMoreIcon,
  ExpandLess: ExpandLessIcon,
  Computer,
  Laptop,
  PhoneAndroid,
  DevicesOther,
  Build,
  Support,
  Announcement,
  Event,
  RequestQuote,
  ReceiptLong,
  Sms,
  Receipt,
  AccountBalance,
  Book,
  Cancel,
  Calculate,
  Visibility,
  CurrencyRupee,
  ListAlt,
  AddCircle,
  Assessment,
  Savings,
  Refresh,
  PiggyBank: AccountBalance,
  BarChart,
  FileCopy,
  Undo,
  Assignment,
  Class,
  MenuBook,
  EventNote,
  LocationOn,
  Schedule,
  Settings,
  TableChart,
  ArrowBack,
  CardMembership,
  Delete,
  Save,
  Edit,
  Warning,
  Notifications,
  Circle,
  DirectionsBus,
};

/**
 * Converts an Iconify identifier (e.g. "mdi:home" or "tabler:school")
 * into a valid raw SVG endpoint URL ("https://api.iconify.design/mdi/home.svg").
 * The Iconify SVG API requires prefix/name.svg instead of prefix:name.svg.
 */
export const getIconifyUrl = (icon: string): string => {
  if (!icon) return "";
  const trimmed = icon.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Replace the prefix colon with a slash: "prefix:name" -> "prefix/name"
  const formatted = trimmed.includes(":") ? trimmed.replace(":", "/") : trimmed;
  return `https://api.iconify.design/${formatted}.svg`;
};

export interface DynamicIconProps {
  icon: string;
  size?: string | number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Dynamic Icon Component for rendering Iconify icons via CSS mask
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  icon,
  size = "1.5rem",
  color = "currentColor",
  className = "",
  style,
}) => {
  if (!icon) return null;
  const iconUrl = getIconifyUrl(icon);
  const sizeStr = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      className={`dynamic-icon ${className}`.trim()}
      style={{
        width: sizeStr,
        height: sizeStr,
        display: "inline-block",
        backgroundColor: color,
        mask: `url(${iconUrl}) no-repeat center / contain`,
        WebkitMask: `url(${iconUrl}) no-repeat center / contain`,
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

