package com.samsoft.bootifull.auth;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
class SpaController {

	@GetMapping(value = { "/dashboard", "/profile", "/app/{path:[^\\.]*}" })
	String forwardSpaRoutes() {
		return "forward:/index.html";
	}
}
