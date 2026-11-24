package com.ecommerce.store.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

/** The caller's id, from the verified token and nothing else. */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@AuthenticationPrincipal(expression = "T(Long).valueOf(subject)")
public @interface CurrentUserId {

}
