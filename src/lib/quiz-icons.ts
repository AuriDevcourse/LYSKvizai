import {
  Brain, BookOpen, GraduationCap, Lightbulb, Sparkles,
  Globe, MapPin, Mountain, Trees, Waves,
  Landmark, Crown, Scroll, Swords,
  FlaskConical, Atom, Dna, Microscope, Rocket,
  Calculator, Puzzle,
  Film, Clapperboard, Tv, Play, Camera,
  Music, Guitar, Mic, Headphones,
  Cpu, Smartphone, Bot, Wifi, Code, Monitor,
  Trophy, Medal, Dribbble, Bike, Dumbbell,
  UtensilsCrossed, Wine, Pizza, Cookie, Coffee,
  PawPrint, Fish, Bird, Bug, Flower2,
  Gamepad2, Joystick, Dices, Target,
  Newspaper, Clock, Calendar, History,
  Star, Heart, Smile, ZoomIn, HelpCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated palette of Lucide icons for quiz categories. Keys are the icon
 * names stored in quiz JSON `icon` field. Used by both the editor picker
 * and the quiz theme resolver.
 */
export const QUIZ_ICONS: Record<string, LucideIcon> = {
  // General / learning
  Brain, BookOpen, GraduationCap, Lightbulb, Sparkles, HelpCircle,

  // Geography / nature
  Globe, MapPin, Mountain, Trees, Waves, Flower2,

  // History / culture
  Landmark, Crown, Scroll, Swords, History,

  // Science
  FlaskConical, Atom, Dna, Microscope, Rocket,

  // Math / logic
  Calculator, Puzzle,

  // Film / TV
  Film, Clapperboard, Tv, Play, Camera,

  // Music
  Music, Guitar, Mic, Headphones,

  // Tech
  Cpu, Smartphone, Bot, Wifi, Code, Monitor,

  // Sports
  Trophy, Medal, Dribbble, Bike, Dumbbell,

  // Food / drink
  UtensilsCrossed, Wine, Pizza, Cookie, Coffee,

  // Animals
  PawPrint, Fish, Bird, Bug,

  // Gaming
  Gamepad2, Joystick, Dices, Target,

  // News / time
  Newspaper, Clock, Calendar,

  // Misc
  Star, Heart, Smile, ZoomIn,
};

export type QuizIconName = keyof typeof QUIZ_ICONS;

export function isValidIconName(name: string | undefined | null): name is QuizIconName {
  return !!name && name in QUIZ_ICONS;
}

export function getIcon(name: string | undefined | null): LucideIcon | null {
  if (!name) return null;
  return QUIZ_ICONS[name] ?? null;
}

/** Display order for the editor picker — groups related icons for scannability. */
export const ICON_PICKER_ORDER: QuizIconName[] = [
  "Brain", "BookOpen", "GraduationCap", "Lightbulb", "Sparkles", "HelpCircle",
  "Globe", "MapPin", "Mountain", "Trees", "Waves", "Flower2",
  "Landmark", "Crown", "Scroll", "Swords", "History",
  "FlaskConical", "Atom", "Dna", "Microscope", "Rocket",
  "Calculator", "Puzzle",
  "Film", "Clapperboard", "Tv", "Play", "Camera",
  "Music", "Guitar", "Mic", "Headphones",
  "Cpu", "Smartphone", "Bot", "Wifi", "Code", "Monitor",
  "Trophy", "Medal", "Dribbble", "Bike", "Dumbbell",
  "UtensilsCrossed", "Wine", "Pizza", "Cookie", "Coffee",
  "PawPrint", "Fish", "Bird", "Bug",
  "Gamepad2", "Joystick", "Dices", "Target",
  "Newspaper", "Clock", "Calendar",
  "Star", "Heart", "Smile", "ZoomIn",
];
