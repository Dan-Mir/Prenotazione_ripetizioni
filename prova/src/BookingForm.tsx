import React, { useState } from "react";

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSubmit: () => void;
}

export function BookingForm({ selectedDate, selectedTime, onSubmit }: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name,
      email,
      phone,
      duration,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedTime,
    };

    try {
      const response = await fetch("http://localhost:5000/book-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Prenotazione avvenuta con successo!");
        onSubmit();
      } else {
        alert("Errore: " + data.error);
      }
    } catch (error) {
      alert("Errore di rete");
    } finally {
    setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">
        Prenotazione per il {selectedDate.toLocaleDateString()} alle {selectedTime}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefono:</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Durata (minuti):</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>30 minuti</option>
            <option value={60}>60 minuti</option>
            <option value={90}>90 minuti</option>
            <option value={120}>120 minuti</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loader border-white"></span>
          ) : (
            "Prenota"
          )}
        </button>
      </form>
    </div>
  );
}