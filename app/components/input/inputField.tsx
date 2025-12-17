import { InputFieldProps } from "./inputFieldProp";
import styles from "./inputField.module.css";

export default function InputField(props: InputFieldProps) {
    const variant = props.variant;
    const onChange = props.onChange;
    return (
        <div className={styles["input-field-container"]}>
            <label>{props.title}:</label>
            {(variant === "text" || variant === "email" || variant === "password") && (
                <input
                    type={variant}
                    value={props.value}
                    onChange={onChange}
                    className={props.classname ?? styles["input-field"]}
                    placeholder={props.placeholder}
                />
            )}
            {(variant === "number") && (
                <input
                    type="number"
                    value={props.value}
                    onChange={onChange}
                    className={props.classname ?? styles["input-field"]}
                    placeholder={props.placeholder}
                    max={props.max}
                    min={props.min}
                />
            )}
            {(variant === "date") && (
                <input
                    type="date"
                    value={props.value ? props.value?.toISOString().split("T")[0] : ""}
                    onChange={onChange}
                     className={props.classname ?? styles["input-field"]}
                />
            )}
        </div>
    );
}

