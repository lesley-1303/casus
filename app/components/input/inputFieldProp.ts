interface BaseInputFieldProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  classname?: string
}

interface BaseStringInputFieldProps{
  value: string | undefined;
  placeholder: string;
}

type TextInputFieldProps = BaseInputFieldProps & BaseStringInputFieldProps & {
  variant: "text";
};

type NumberInputFieldProps = BaseInputFieldProps & {
  variant: "number";
  value: number | undefined;
  placeholder: string;
  min?: number;
  max?: number
};

type DateInputFieldProps = BaseInputFieldProps & {
  variant: "date";
  value: Date | undefined;
};

type EmailInputFieldProps = BaseInputFieldProps & BaseStringInputFieldProps & {
  variant: "email";
};

type PasswordInputFieldProps = BaseInputFieldProps & BaseStringInputFieldProps & {
  variant: "password";
};

export type InputFieldProps =
  | TextInputFieldProps
  | NumberInputFieldProps
  | DateInputFieldProps
  | EmailInputFieldProps
  | PasswordInputFieldProps
  

