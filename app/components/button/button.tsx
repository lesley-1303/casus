import { ButtonProps } from "./buttonProps";
import styles from "./button.module.css";

export default function Button(props: ButtonProps) {
    return (
        <button disabled={props.disabled} className={styles.button} onClick={props.onClick}>
            {props.title}
        </button>
    );
}

