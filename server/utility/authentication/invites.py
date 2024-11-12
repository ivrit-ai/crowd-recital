VALID_INVITE_DIGIT_SUM = 18


def validate_invite_value(invite_value: str | None) -> bool:
    if invite_value is not None:
        sum_of_digits = 0
        for c in invite_value:
            if c.isdigit():
                sum_of_digits += int(c)

        return sum_of_digits == VALID_INVITE_DIGIT_SUM

    return False
