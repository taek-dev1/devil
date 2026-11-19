package com.example.devil;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DevilApplication {

	public static void main(String[] args) {
		SpringApplication.run(DevilApplication.class, args);
		System.out.println("안녕 hi");
	}

}
