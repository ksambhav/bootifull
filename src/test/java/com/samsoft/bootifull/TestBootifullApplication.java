package com.samsoft.bootifull;

import org.springframework.boot.SpringApplication;

public class TestBootifullApplication {

	public static void main(String[] args) {
		SpringApplication.from(BootifullApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
